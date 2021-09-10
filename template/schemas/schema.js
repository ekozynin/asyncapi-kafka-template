import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi }) {
  const messages = asyncapi.allMessages();

  const topicsFiles = [];

  messages.forEach((value, key, map) => {
    const fileName = `${key.replace(/\./g, '_').replace(/-/g, '_')}.py`;

    topicsFiles.push(
      <File name={fileName}>
        {createSchema(key, value)}
      </File>
    );
  });

  return topicsFiles;
}

function createSchema(messageName, message) {
  const messagePayload = message.originalPayload();
  const messageNamespace = messagePayload.namespace;
  const schemaFormat = message.originalSchemaFormat();
  const schemaReferences = message.extensions()['x-schemaReferences'] ?? [];

  // https://docs.confluent.io/platform/current/schema-registry/avro.html#schema-evolution-and-compatibility
  // we only want to define message compatibility for topic's value schemas
  const messageCompatibility = 'NONE';

  return `import logging, sys

from common.register_schema import add_schema

### ----- main()
def main(schema_registry_client):
    logging.info("-------------------------------------")
    logging.info('Adding schema ${messageNamespace}.${messageName}')
    add_schema('${messageNamespace}.${messageName}', '${schemaFormat}', '${JSON.stringify(messagePayload)}', '${messageCompatibility}', ${JSON.stringify(schemaReferences)})
### ----- END main()

  `;
}
