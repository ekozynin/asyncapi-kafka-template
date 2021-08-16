import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi }) {
  const bootstrapServers = 'localhost:9092'; // TODO
  const schemaRegistry = 'http://localhost:8081'; // TODO
  const channels = asyncapi.channels();

  const messagesFiles = [];

  Object.entries(channels).map(([channelName, channel]) => {
    const fileName = `${channelName.replace(/\./g, '_').replace(/-/g, '_')}.py`;

    messagesFiles.push(
      <File name={fileName}>
        {createTopicCommand(channelName, channel, bootstrapServers, schemaRegistry)}
      </File>
    );
  });

  return messagesFiles;
}

function createTopicCommand(channelName, channel, bootstrapServers, schemaRegistry) {
  const partitions = channel.bindings().kafka.partitions;
  const replicationFactor = channel.bindings().kafka.replicas;
  const topicConfigs = channel.bindings().kafka.configs;
  const valueSchema = channel.bindings().kafka.valueSchema;

  return `import logging

from confluent_kafka.admin import AdminClient, NewTopic
from confluent_kafka.schema_registry import SchemaRegistryClient, Schema

### ----- create_new_topic()
def create_new_topic(admin_client, channelName, partitions, replicationFactor, topicConfigs):
    new_topics = [NewTopic(channelName, num_partitions=partitions, replication_factor=replicationFactor, config=topicConfigs)]

    # Call create_topics to asynchronously create topics.
    #  A dict of <topic,future> is returned.
    fs = admin_client.create_topics(new_topics);

    logging.debug('Creating new topic ${channelName}')
    # Wait for each operation to finish.
    for topic, f in fs.items():
        try:
            f.result()  # The result itself is None
            logging.debug("Topic {} created".format(topic))
        except Exception as e:
            logging.error("Failed to create topic {}: {}".format(topic, e))
### ----- END create_new_topic()

### ----- register_topic_schema()
def register_topic_schema(schema_registry_client, channel_name, schema_type, schema_payload, compatibility_level = 'FULL'):
    schema = Schema(schema_payload, schema_type=schema_type)

    logging.debug('Registering value schema for topic ${channelName}')
    try:
        schemaVersion = schema_registry_client.register_schema(channel_name + '-value', schema)
        logging.debug('Value schema for topic {} has been registered with the version {}'.format(channel_name, schemaVersion))
    except SchemaRegistryError as e:
        logging.error("Failed to register value schema for topic {}: {}".format(channel_name, e))

    logging.debug('Setting schema compatibility level to {} for topic {}'.format(compatibility_level, channel_name))
    try:
        resultCompatibilityLevel = schema_registry_client.set_compatibility(channel_name.join("-value"), compatibility_level)
        logging.debug('Topic ${channelName} schema compatibility level is ' + resultCompatibilityLevel['compatibility'])
    except SchemaRegistryError as e:
        logging.error("Failed to set value schema compatibility for topic {} to {} level: {}".format(channel_name, compatibility_level, e))
### ----- END register_topic_schema()

### ----- main()
def main():
    logging.debug('Creating AdminClient with bootstrap.servers ${bootstrapServers}')
    admin_client = AdminClient({'bootstrap.servers': '${bootstrapServers}'})

    logging.debug('Creating SchemaRegistryClient with schemaRegistryUrl ${schemaRegistry}')
    schema_registry_client = SchemaRegistryClient({'url': '${schemaRegistry}'})

    # TODO check if the topic already exists, pull the topic's definition, and alter topic if required

    # create new topic
    logging.info('Creating new topic ${channelName}')
    create_new_topic(admin_client, '${channelName}', ${partitions}, ${replicationFactor}, ${JSON.stringify(topicConfigs)})

    # register schema for the new topic
    if 'true' == '${valueSchema !== undefined}':
        logging.info('Registering value schema for topic ${channelName}')
        register_topic_schema(schema_registry_client, '${channelName}', 'AVRO', '${JSON.stringify(valueSchema)}')
### ----- END main()

  `;
}
