import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi }) {
  const channels = asyncapi.channels();

  const messagesFiles = [];

  Object.entries(channels).map(([channelName, channel]) => {
    const fileName = `${channelName.replace(/\./g, '_').replace(/-/g, '_')}.py`;

    messagesFiles.push(
      <File name={fileName}>
        {createTopicCommand(channelName, channel)}
      </File>
    );
  });

  return messagesFiles;
}

function createTopicCommand(channelName, channel) {
  const partitions = channel.bindings().kafka.partitions;
  const replicationFactor = channel.bindings().kafka.replicas;
  const topicConfigs = channel.bindings().kafka.configs;
  const valueSchema = channel.bindings().kafka.valueSchema;

  return `import logging

from confluent_kafka.admin import AdminClient, NewTopic, ConfigResource
from confluent_kafka.schema_registry import SchemaRegistryClient, Schema
from confluent_kafka import KafkaException, KafkaError

### ----- create_new_topic()
def create_new_topic(admin_client, channel_name, partitions, replicationFactor, topic_configs):
    # check if the topic already exists, pull the topic's definition, and alter the topic as required
    topic_config_resource = ConfigResource(ConfigResource.Type.TOPIC, channel_name)

    topic_config = None
    try:
        fs = admin_client.describe_configs([topic_config_resource])
        topic_config = fs.get(topic_config_resource).result()
    except KafkaException as e:
        if e.args[0].code() == KafkaError.UNKNOWN_TOPIC_OR_PART:
            logging.debug("Topic {} doesn't exists".format(channel_name))
        else:
            raise e

    if topic_config is None:
        logging.debug('Creating new topic {}'.format(channel_name))
        topic = NewTopic(channel_name, num_partitions=partitions, replication_factor=replicationFactor, config=topic_configs)

        try:
            fs = admin_client.create_topics([topic])
            fs.get(channel_name).result() # returns None
            logging.info("Topic {} has been created.".format(channel_name))
        except KafkaException as e:
            if (e.args[0].code() == KafkaError.TOPIC_ALREADY_EXISTS):
                logging.debug("Topic {} already exists".format(channel_name))
            else:
                raise e
    else:
        logging.info("Altering topic {} config".format(channel_name))

        # TODO alter number of partitions if needed
        # https://docs.confluent.io/platform/current/clients/confluent-kafka-python/html/index.html#confluent_kafka.admin.AdminClient.create_partitions

        # TODO update topic replication factor

        # Merge values from existing config and new config
        for config_entry in topic_config.values():
            topic_config_resource.set_config(config_entry.name, config_entry.value)
        for key in topic_configs:
            logging.info("- Setting {}={}".format(key, topic_configs[key]))
            topic_config_resource.set_config(key, topic_configs[key])

        fs = admin_client.alter_configs([topic_config_resource])
        fs.get(topic_config_resource).result()
### ----- END create_new_topic()

### ----- register_topic_schema()
def register_topic_schema(schema_registry_client, channel_name, schema_type, schema_payload, compatibility_level = 'FULL'):
    schema = Schema(schema_payload, schema_type=schema_type)

    logging.debug('Registering value schema for topic {}'.format(channel_name))
    try:
        schemaVersion = schema_registry_client.register_schema(channel_name + '-value', schema)
        logging.info('Value schema for topic {} has been registered with the version {}'.format(channel_name, schemaVersion))
    except SchemaRegistryError as e:
        logging.error("Failed to register value schema for topic {}: {}".format(channel_name, e))
        raise e

    logging.debug('Setting schema compatibility level to {} for topic {}'.format(compatibility_level, channel_name))
    try:
        resultCompatibilityLevel = schema_registry_client.set_compatibility(channel_name.join("-value"), compatibility_level)
        logging.info('Topic {} schema compatibility level is {}'.format(channel_name, resultCompatibilityLevel['compatibility']))
    except SchemaRegistryError as e:
        logging.error("Failed to set value schema compatibility for topic {} to {} level: {}".format(channel_name, compatibility_level, e))
        raise e
### ----- END register_topic_schema()

### ----- main()
def main(admin_client, schema_registry_client):
    logging.info("-------------------------------------")
    logging.info("Creating/updating topic '${channelName}'")
    create_new_topic(admin_client, '${channelName}', ${partitions}, ${replicationFactor}, ${JSON.stringify(topicConfigs)})

    # register schema for the topic
    if 'true' == '${valueSchema !== undefined}':
        register_topic_schema(schema_registry_client, "${channelName}", "AVRO", '${JSON.stringify(valueSchema)}')
### ----- END main()

  `;
}
