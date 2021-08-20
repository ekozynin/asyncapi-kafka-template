import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi, params }) {
  const servers = asyncapi.servers();
  const environmentConfigurationMap = createEnvironmentConfigurationMap(servers);

  return ([
    <File name="main.py">
      { createIndexFile(environmentConfigurationMap) }
    </File>
  ]);
}

function createEnvironmentConfigurationMap(servers) {
  var environmentMap = new Map();

  const myMap = Object
        .entries(servers)
        .map(([environmentName, environmentInfo]) => {
            const bootstrapServers = environmentInfo.url();
            const schemaRegistry = environmentInfo.json('x-schema-registry-url');

          var jsonData = {};
          jsonData['bootstrapServers'] = bootstrapServers;
          jsonData['schemaRegistry'] = schemaRegistry;

          environmentMap.set(environmentName, jsonData);
        });

  return environmentMap;
}

function createIndexFile(environmentConfigurationMap) {
  return `import logging, sys
import getopt
import json

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
    environment_configuration_map = json.loads('${JSON.stringify(Object.fromEntries(environmentConfigurationMap))}')

    environment_name = get_environment_name(argv)
    environment_configuration = environment_configuration_map.get(environment_name)

    if environment_configuration == None:
        logging.error("Can't find environment configuration for '{}' environment".format(environment_name))
        sys.exit(2)

    bootstrap_servers = environment_configuration.get('bootstrapServers')
    schema_registry_url = environment_configuration.get('schemaRegistry')

    logging.info("#########################################################")
    logging.info("Starting configuration for '{}' environment".format(environment_name))
    logging.info("bootstrap.servers = {}".format(bootstrap_servers))
    logging.info("schema_registry_url = {}".format(schema_registry_url))
    logging.info("#########################################################")

    logging.debug("Creating AdminClient with bootstrap.servers {}".format(bootstrap_servers))
    admin_client = AdminClient({"bootstrap.servers": bootstrap_servers})

    logging.debug("Creating SchemaRegistryClient with schemaRegistryUrl {}".format(schema_registry_url))
    schema_registry_client = SchemaRegistryClient({"url": schema_registry_url})

    topics.main(admin_client, schema_registry_client)
    schemas.main(schema_registry_client)
### ----- END main()

if __name__ == "__main__":
    main(sys.argv[1:])

`;
}