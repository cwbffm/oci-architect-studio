"""Terraform JSON compiler: browser text is never evaluated as HCL or a template."""
import ipaddress
import re

TYPES = {'vcn': 'oci_core_vcn', 'subnet': 'oci_core_subnet',
         'nsg': 'oci_core_network_security_group', 'igw': 'oci_core_internet_gateway',
         'nat': 'oci_core_nat_gateway', 'route': 'oci_core_route_table',
         'bucket': 'oci_objectstorage_bucket', 'volume': 'oci_core_volume',
         'compute': 'oci_core_instance', 'drg': 'oci_core_drg'}


def literal(v):
    """Escape Terraform's two template openers, including in JSON syntax strings."""
    return str(v).replace('${', '$${').replace('%{', '%%{')


def text(v, label, maxlen=255, required=True):
    if not isinstance(v, str) or len(v) > maxlen or any(ord(x) < 32 for x in v):
        raise ValueError(f'{label}: invalid text')
    if required and not v.strip():
        raise ValueError(f'{label}: required')
    return literal(v)


def number(v, label, low, high):
    if isinstance(v, bool):
        raise ValueError(f'{label}: invalid number')
    try:
        n = float(v)
    except (TypeError, ValueError):
        raise ValueError(f'{label}: invalid number') from None
    if not low <= n <= high or n != int(n):
        raise ValueError(f'{label}: outside supported range')
    return int(n)


def network(v, label):
    try:
        n = ipaddress.ip_network(v, strict=True)
        if n.version != 4:
            raise ValueError()
        return n
    except (ValueError, TypeError):
        raise ValueError(f'{label}: valid canonical IPv4 CIDR required') from None


def compile_state(state, settings):
    if not isinstance(state.get('compartmentId'), str) or not isinstance(state.get('region'), str):
        raise ValueError('Region and compartment must be strings')
    if not isinstance(state.get('tags', []), list) or len(state.get('tags', [])) > 10:
        raise ValueError('Provide at most 10 freeform tags')
    if state.get('projectName') is not None:
        text(state['projectName'], 'project name', 255, False)
    if state.get('includeIam') is not False or state.get('createTagSchema') is not False:
        raise ValueError('Disable IAM policy and tag schema creation before integration')
    comp, region = state.get('compartmentId'), state.get('region')
    if comp not in settings.compartments or region not in settings.regions:
        raise ValueError('Region or compartment is not allowed by the server')
    resources = state.get('resources')
    if not isinstance(resources, list) or not 1 <= len(resources) <= 100:
        raise ValueError('Provide 1 to 100 supported resources')
    by_id = {}
    for r in resources:
        if not isinstance(r, dict) or not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]{0,79}', str(r.get('id', ''))):
            raise ValueError('Invalid resource identifier')
        if r['id'] in by_id or r.get('type') not in TYPES:
            raise ValueError('Duplicate identifier or unsupported resource type: ' + str(r.get('type'))[:40])
        if not isinstance(r.get('values'), dict) or any(not isinstance(v, (str, bool, int, float, type(None))) for v in r['values'].values()):
            raise ValueError('Invalid resource values')
        if r.get('region') and r['region'] != region:
            raise ValueError('Resource region differs from the selected region')
        if r['values'].get('compartmentId') not in (None, '', comp):
            raise ValueError('Resource compartment overrides are not permitted')
        by_id[r['id']] = r
    result = {'terraform': {'required_version': '>= 1.5.0, < 2.0.0',
                            'required_providers': {'oci': {'source': 'oracle/oci', 'version': '~> 9.11.0'}}},
              'provider': {'oci': {'region': region}}, 'resource': {}, 'output': {}}
    def add(kind, rid, value):
        if rid in result['resource'].get(kind, {}):
            raise ValueError('Resource identifier collides with a generated dependency')
        result['resource'].setdefault(kind, {})[rid] = value
    def ref(value, expected):
        if value not in by_id or by_id[value]['type'] not in expected:
            raise ValueError('Network dependencies must reference supported resources in this architecture')
        return '${' + TYPES[by_id[value]['type']] + '.' + value + '.id}'
    tags = {}
    for tag in state.get('tags', []):
        if not isinstance(tag, dict) or tag.get('kind') != 'freeform':
            raise ValueError('Only freeform tags are supported in direct integration')
        tags[text(tag.get('key'), 'tag key', 100)] = text(tag.get('value', ''), 'tag value', 256, False)
    if len(tags) > 10:
        raise ValueError('At most 10 freeform tags are supported')
    subnet_networks = {}
    for rid, r in by_id.items():
        a, t = r['values'], r['type']
        name = text(r.get('name'), 'resource name')
        attrs = {'compartment_id': comp, 'display_name': name, 'freeform_tags': tags}
        if t == 'vcn':
            net = network(a.get('cidr'), 'VCN CIDR')
            if not 16 <= net.prefixlen <= 30:
                raise ValueError('VCN prefix must be /16 to /30')
            attrs['cidr_blocks'] = [str(net)]
        if t in ('vcn', 'subnet') and a.get('dns'):
            if not re.fullmatch(r'[a-zA-Z][a-zA-Z0-9]{0,14}', a['dns']):
                raise ValueError('Invalid DNS label')
            attrs['dns_label'] = a['dns']
        if t in ('subnet', 'nsg', 'igw', 'nat', 'route'):
            attrs['vcn_id'] = ref(a.get('vcn'), ('vcn',))
        if t == 'subnet':
            net = network(a.get('cidr'), 'subnet CIDR')
            parent = network(by_id[a['vcn']]['values'].get('cidr'), 'VCN CIDR')
            if not 16 <= net.prefixlen <= 30 or not net.subnet_of(parent):
                raise ValueError('Subnet must be /16 to /30 inside its VCN')
            for other, vcn in subnet_networks.values():
                if vcn == a['vcn'] and net.overlaps(other):
                    raise ValueError('Overlapping subnet CIDRs')
            subnet_networks[rid] = (net, a['vcn'])
            if a.get('private') not in ('true', 'false'):
                raise ValueError('Select subnet privacy explicitly')
            attrs.update(cidr_block=str(net), prohibit_public_ip_on_vnic=a['private'] == 'true')
            # Explicit empty rules avoid inheriting permissive default security lists.
            sl = rid + '_security'
            add('oci_core_security_list', sl, {'compartment_id': comp,
                'vcn_id': attrs['vcn_id'], 'display_name': name + ' security',
                'ingress_security_rules': [], 'egress_security_rules': []})
            attrs['security_list_ids'] = ['${oci_core_security_list.' + sl + '.id}']
            if a.get('routeTable'):
                target = by_id.get(a['routeTable'])
                if not target or target['values'].get('vcn') != a['vcn']:
                    raise ValueError('Subnet route table must belong to its VCN')
                attrs['route_table_id'] = ref(a['routeTable'], ('route',))
            else:
                rt = rid + '_route'
                add('oci_core_route_table', rt, {'compartment_id': comp,
                     'vcn_id': attrs['vcn_id'], 'display_name': name + ' routes', 'route_rules': []})
                attrs['route_table_id'] = '${oci_core_route_table.' + rt + '.id}'
        if t == 'nsg':
            protocol = a.get('protocol')
            if protocol not in ('6', '17', 'all'):
                raise ValueError('Unsupported NSG protocol')
            rule = {'network_security_group_id': '${oci_core_network_security_group.' + rid + '.id}',
                    'direction': 'INGRESS', 'protocol': protocol,
                    'source': str(network(a.get('source'), 'NSG source')), 'source_type': 'CIDR_BLOCK'}
            if protocol != 'all':
                port = number(a.get('port'), 'port', 1, 65535)
                rule['tcp_options' if protocol == '6' else 'udp_options'] = {'destination_port_range': {'min': port, 'max': port}}
            add('oci_core_network_security_group_security_rule', rid + '_ingress', rule)
        if t == 'igw':
            attrs['enabled'] = True
        if t == 'route':
            if a.get('destinationType', 'CIDR_BLOCK') != 'CIDR_BLOCK':
                raise ValueError('Direct integration initially supports CIDR routes only')
            target = by_id.get(a.get('target'))
            if not target or target['type'] == 'drg' or target['values'].get('vcn') != a['vcn']:
                raise ValueError('Route gateway must belong to the same VCN')
            attrs['route_rules'] = [{'destination': str(network(a.get('destination'), 'route destination')),
                                    'destination_type': 'CIDR_BLOCK',
                                    'network_entity_id': ref(a.get('target'), ('igw', 'nat', 'drg'))}]
        if t in ('volume', 'compute'):
            attrs['availability_domain'] = text(a.get('ad'), 'availability domain', 100)
        if t == 'volume':
            if number(a.get('vpus'), 'volume VPUs', 0, 120) % 10:
                raise ValueError('Volume VPUs must be a multiple of 10')
            attrs.update(size_in_gbs=number(a.get('size'), 'volume size', 50, 32768),
                         vpus_per_gb=number(a.get('vpus'), 'volume VPUs', 0, 120))
        if t == 'bucket':
            attrs.pop('display_name')
            if not re.fullmatch(r'[a-zA-Z0-9_.-]{1,256}', r['name']):
                raise ValueError('Invalid bucket name')
            attrs['name'] = r['name']
            if a.get('namespace'):
                attrs['namespace'] = text(a['namespace'], 'namespace', 100)
            else:
                result.setdefault('data', {})['oci_objectstorage_namespace'] = {'current': {}}
                attrs['namespace'] = '${data.oci_objectstorage_namespace.current.namespace}'
            if a.get('tier') not in ('Standard', 'InfrequentAccess', 'Archive') or a.get('versioning') not in ('Enabled', 'Disabled'):
                raise ValueError('Invalid bucket tier/versioning')
            attrs.update(storage_tier=a['tier'], versioning=a['versioning'], access_type='NoPublicAccess')
        if t in ('volume', 'bucket') and a.get('kmsKey'):
            raise ValueError('KMS customization is not yet supported in direct integration')
        if t == 'compute':
            if any(a.get(k) for k in ('bootstrapEnabled', 'winBootstrapEnabled', 'configureUser', 'kmsKey', 'reservedPublicIp')):
                raise ValueError('Direct Compute requires bootstrap/custom user/KMS/reserved IP disabled')
            if a.get('guestOs', 'LINUX') != 'LINUX' or a.get('publicIp') != 'none':
                raise ValueError('Direct Compute initially supports private Linux instances only')
            if not re.fullmatch(r'VM\.Standard\.(?:E[45]|A[12])\.Flex', str(a.get('shape', ''))):
                raise ValueError('Unsupported direct Compute shape')
            if not re.fullmatch(r'ocid1\.image\.[a-z0-9_.-]{8,256}', str(a.get('imageId', ''))):
                raise ValueError('Fill a regional image OCID')
            cp = number(a.get('ocpus'), 'OCPUs', 1, 80)
            mem = number(a.get('memory'), 'memory', cp, min(cp * 64, 1024))
            vnic = {'subnet_id': ref(a.get('subnet'), ('subnet',)), 'assign_public_ip': False}
            if a.get('nsgIds'):
                groups = [x.strip() for x in a['nsgIds'].split(',') if x.strip()]
                if not groups or len(groups) > 5:
                    raise ValueError('Provide 1 to 5 internal NSG references')
                for group in groups:
                    if group not in by_id or by_id[group]['type'] != 'nsg' or by_id[group]['values'].get('vcn') != by_id[a['subnet']]['values'].get('vcn'):
                        raise ValueError('Compute NSGs must be internal references in the same VCN')
                vnic['nsg_ids'] = [ref(group, ('nsg',)) for group in groups]
            if a.get('privateIp'):
                try:
                    ip = ipaddress.ip_address(a['privateIp'])
                    net = network(by_id[a['subnet']]['values']['cidr'], 'subnet CIDR')
                    if ip not in net or int(ip) <= int(net.network_address) + 1 or ip == net.broadcast_address:
                        raise ValueError()
                    vnic['private_ip'] = str(ip)
                except ValueError:
                    raise ValueError('Invalid private IP for Compute subnet') from None
            attrs.update(shape=a['shape'], shape_config={'ocpus': cp, 'memory_in_gbs': mem},
                         source_details={'source_type': 'image', 'source_id': a['imageId'],
                                         'boot_volume_size_in_gbs': number(a.get('bootSize'), 'boot size', 50, 32768)},
                         create_vnic_details=vnic)
            if a.get('sshKey'):
                key = text(a['sshKey'], 'SSH public key', 8192)
                if not re.fullmatch(r'(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp256) [A-Za-z0-9+/=]+(?: [^\r\n]*)?', key):
                    raise ValueError('A valid SSH public key is required')
                attrs['metadata'] = {'ssh_authorized_keys': key}
        add(TYPES[t], rid, attrs)
        attr = 'name' if t == 'bucket' else 'id'
        result['output'][rid] = {'value': '${' + TYPES[t] + '.' + rid + '.' + attr + '}'}
    return result
