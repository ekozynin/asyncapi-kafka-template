import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi, params }) {
  const serversConfigurationMap = createServersConfigurationMap(asyncapi);

  return ([
    <File name="main.py">
      { createIndexFile(serversConfigurationMap) }
    </File>
  ]);
}

function createServersConfigurationMap(asyncapi) {
  const servers = asyncapi.servers();

  const serversMap = new Map();

  Object
    .entries(servers)
    .map(([serverName, serverInfo]) => {
      const serverUrl = serverInfo.url();

      const serverConfig = {};
      serverConfig['url'] = serverUrl;

      if (serverInfo.security()) {
        const securitySchemaName = Object.keys(serverInfo.security()[0]['_json'])[0];

        serverConfig['security'] = asyncapi.components().securityScheme(securitySchemaName).extensions()['x-configs'];
      }

      serversMap.set(serverName, serverConfig);
    });

  return serversMap;
}

function createIndexFile(serversConfigurationMap) {
  return `import logging, sys, os
import getopt
import json

from common.register_schema import register_schemas

from confluent_kafka.admin import AdminClient
from confluent_kafka.schema_registry import SchemaRegistryClient

from topics import topics
from schemas import schemas

logging.basicConfig(level=logging.DEBUG)

### ----- get_environment_name()
def get_environment_name(argv):
    opts, args = getopt.getopt(argv,"e:",["environment="])

    environment = None
    for opt, arg in opts:
        if opt in ("-e", "--environment"):
            environment = arg

    if environment == None:
        logging.error('main.py -e <environment>')
        sys.exit(2)

    return environment
### ----- END get_environment_name()

### ----- main()
def main(argv):
    environment_name = get_environment_name(argv)

    server_configuration_map = json.loads('${JSON.stringify(Object.fromEntries(serversConfigurationMap))}')

    broker_configuration = server_configuration_map.get("{}-broker".format(environment_name))
    schema_registry_configuration = server_configuration_map.get("{}-schemaRegistry".format(environment_name))

# TODO
    if broker_configuration == None:
        logging.error("Can't find environment configuration for '{}' environment".format(environment_name))
        sys.exit(2)

    admin_client_config = {"bootstrap.servers": broker_configuration.get('url')}
    if 'security' in broker_configuration:
        cluster_api_key = os.getenv('CLUSTER_API_KEY')
        cluster_api_secret = os.getenv('CLUSTER_API_SECRET')

        admin_client_config.update(broker_configuration['security'])

        admin_client_config['sasl.username'] = cluster_api_key
        admin_client_config['sasl.password'] = cluster_api_secret

    schema_registry_client_config = {"url": schema_registry_configuration.get('url')}
    if 'security' in schema_registry_configuration:
        schema_registry_api_key = os.getenv('SCHEMA_REGISTRY_API_KEY')
        schema_registry_api_secret = os.getenv('SCHEMA_REGISTRY_API_SECRET')

        schema_registry_client_config.update(schema_registry_configuration['security'])

        schema_registry_client_config['basic.auth.user.info'] = '{}:{}'.format(schema_registry_api_key, schema_registry_api_secret)

    logging.info("#########################################################")
    logging.info("Starting configuration for '{}' environment".format(environment_name))
    logging.info("#########################################################")

    logging.debug("Creating AdminClient with bootstrap.servers")
    # https://docs.confluent.io/platform/current/clients/confluent-kafka-python/html/index.html#confluent_kafka.admin.AdminClient
    admin_client = AdminClient(admin_client_config)

    logging.debug("Creating SchemaRegistryClient with schemaRegistryUrl")
    # https://docs.confluent.io/platform/current/clients/confluent-kafka-python/html/index.html#schemaregistryclient
    schema_registry_client = SchemaRegistryClient(schema_registry_client_config)

    schemas.main(schema_registry_client)
    topics.main(admin_client, schema_registry_client)

    logging.info("-------------------------------------")
    logging.info("Rergistering shcemas with the schema repository")
    register_schemas(schema_registry_client)
### ----- END main()

if __name__ == "__main__":
    main(sys.argv[1:])

`;
}