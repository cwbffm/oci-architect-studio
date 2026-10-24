import sys,os,json,socket
# This verifier must never connect to an OCI endpoint.
def denied(*args,**kwargs):raise RuntimeError('Network disabled during CLI argument validation')
socket.create_connection=denied
socket.socket.connect=denied
sys.argv=['oci',*sys.argv[1:]]
from oci_cli import cli_util
class Client:
 def __getattr__(self,name):
  def capture(*args,**kwargs):
   print(json.dumps({'method':name,'keys':list(kwargs)}));raise SystemExit(0)
  return capture
cli_util.build_client=lambda *args,**kwargs:Client()
from oci_cli.cli import cli
cli()
