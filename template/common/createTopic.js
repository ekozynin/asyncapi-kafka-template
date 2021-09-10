import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi, params }) {
  return ([
    <File name="create_topic.py">
      { createTopic() }
    </File>
  ]);
}

function createTopic() {
  return `import logging, sys

from confluent_kafka.admin import NewTopic, ConfigResource
from confluent_kafka import KafkaException, KafkaError

### ----- create_topic()
def create_topic(admin_client, channel_name, partitions, replicationFactor, topic_configs):
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
            logging.error("Failed to retrieve topic's {} config: {}".format(channel_name, e))
            sys.exit(2)

    if topic_config is None:
        logging.debug('Creating new topic {}'.format(channel_name))
        topic = NewTopic(channel_name, num_partitions=partitions, replication_factor=replicationFactor, config=topic_configs)

        try:
            fs = admin_client.create_topics([topic])
            fs.get(channel_name).result() # returns None
            logging.info("Topic {} has been created.".format(channel_name))
        except KafkaException as e:
            logging.error("Failed to create topic {}: {}".format(channel_name, e))
            sys.exit(2)
    else:
        logging.info("Altering topic {} config".format(channel_name))

        # TODO alter number of partitions if needed
        # https://docs.confluent.io/platform/current/clients/confluent-kafka-python/html/index.html#confluent_kafka.admin.AdminClient.create_partitions

        # TODO update topic replication factor if needed

        # Merge values from existing config and new config
        for config_entry in topic_config.values():
            topic_config_resource.set_config(config_entry.name, config_entry.value)
        for key in topic_configs:
            logging.info("- Setting {}={}".format(key, topic_configs[key]))
            topic_config_resource.set_config(key, topic_configs[key])

        fs = admin_client.alter_configs([topic_config_resource])
        fs.get(topic_config_resource).result()
### ----- END create_topic()
  `;
}

module.exports = { createTopic };