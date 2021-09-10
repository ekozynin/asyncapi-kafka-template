import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi }) {
  const channels = asyncapi.channels();

  const messagesFiles = [];

  Object.entries(channels).map(([channelName, channel]) => {
    const fileName = `${channelName.replace(/\./g, '_').replace(/-/g, '_')}.py`;

    messagesFiles.push(
      <File name={fileName}>
        {createTopic(channelName, channel)}
      </File>
    );
  });

  return messagesFiles;
}

function createTopic(channelName, channel) {
  const partitions = channel.bindings().kafka['x-partitions'];
  const replicationFactor = channel.bindings().kafka['x-replicas'];
  const topicConfigs = channel.bindings().kafka['x-configs'];

  // https://docs.confluent.io/platform/current/schema-registry/avro.html#schema-evolution-and-compatibility
  const messageCompatibility = channel.extensions()['x-messageCompatibility'] ?? 'NONE';

  const message = channel.extensions()['x-message'];
  const messagePayload = message ? message['x-parser-original-payload'] : null;
  const schemaFormat = message ? message['x-parser-original-schema-format'] : null;

  let schemaReferences = message ? message['x-schemaReferences'] : null;
  if (!schemaReferences) {
    schemaReferences = [];
  }

  return `import logging, sys

from common.register_schema import add_schema
from common.create_topic import create_topic

### ----- main()
def main(admin_client, schema_registry_client):
    logging.info("-------------------------------------")
    logging.info("Creating/updating topic '${channelName}'")
    create_topic(admin_client, '${channelName}', ${partitions}, ${replicationFactor}, ${JSON.stringify(topicConfigs)})

    # register schema for the topic
    if 'true' == '${message !== undefined}':
        add_schema('${channelName}-value', '${schemaFormat}', '${JSON.stringify(messagePayload)}', '${messageCompatibility}', ${JSON.stringify(schemaReferences)})
### ----- END main()

  `;
}
