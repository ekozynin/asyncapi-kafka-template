import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi }) {
  const messages = asyncapi.allMessages();

  const topicsFiles = [];

  messages.forEach((value, key, map) => {
    const fileName = `${key.replace(/\./g, '_').replace(/-/g, '_')}.py`;

    topicsFiles.push(
      <File name={fileName}>
        {createMessageCommand(key, value)}
      </File>
    );
  });

  return topicsFiles;
}

function createMessageCommand(messageName, message) {
  const messagePayload = message.originalPayload();
  const messageNamespace = messagePayload.namespace;
  const schemaType = 'AVRO'; // TODO

  return `import logging

from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka.schema_registry import SchemaRegistryClient, Schema

### ----- register_topic_schema()
def register_schema(schema_registry_client, schema_name, schema_type, schema_payload, compatibility_level = 'FULL'):
    schema = Schema(schema_payload, schema_type=schema_type)

    try:
        schemaVersion = schema_registry_client.register_schema(schema_name, schema)
        logging.info('Value schema for topic {} has been registered with the version {}'.format(schema_name, schemaVersion))
    except SchemaRegistryError as e:
        logging.error("Failed to register value schema for topic {}: {}".format(schema_name, e))
        raise e

    logging.debug('Setting schema compatibility level to {} for topic {}'.format(compatibility_level, schema_name))
    try:
        resultCompatibilityLevel = schema_registry_client.set_compatibility(schema_name, compatibility_level)
        logging.info('Topic {} schema compatibility level is {}'.format(schema_name, resultCompatibilityLevel['compatibility']))
    except SchemaRegistryError as e:
        logging.error("Failed to set schema compatibility for schema {} to {} level: {}".format(schema_name, compatibility_level, e))
        raise e
### ----- END register_topic_schema()

### ----- main()
def main(schema_registry_client):
    logging.info("-------------------------------------")
    logging.info('Registering schema ${messageNamespace}.${messageName}')
    register_schema(schema_registry_client, '${messageNamespace}.${messageName}', '${schemaType}', '${JSON.stringify(messagePayload)}')
### ----- END main()

  `;
}
