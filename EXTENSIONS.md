# AsyncApi Specification Extensions

```yaml
asyncapi: '2.1.0'
info:
  title: Confluent Kafka Example
  version: '0.0.1'
  description: |
    An example of Kafka topology using AsyncApi

servers:
  local-broker:
    url: localhost:9092
    protocol: kafka
    protocolVersion: 2.6.0
    description: local kafka cluster for development

  local-schemaRegistry:
    url: http://localhost:8081
    protocol: kafka
    protocolVersion: 2.6.0
    description: local kafka cluster for development

  dev-broker:
    url: pkc-4n66v.australiaeast.azure.confluent.cloud:9092
    protocol: kafka-secure
    protocolVersion: 2.6.0
    description: confluent cloud kafka cluster for development
    security:
      - confluentBroker: []

  dev-schemaRegistry:
    url: https://psrc-e8vk0.southeastasia.azure.confluent.cloud
    protocol: kafka-secure
    protocolVersion: 2.6.0
    description: confluent cloud kafka cluster for development
    security:
      - confluentSchemaRegistry: []

channels:
  example-channel:
    x-messageCompatibility: 'FULL' # https://docs.confluent.io/platform/current/schema-registry/avro.html#schema-evolution-and-compatibility
    x-message:
      $ref: '#/components/messages/ExampleMessage'
    bindings:
      kafka:
        x-partitions: 9
        x-replicas: 1
        x-configs:
          cleanup.policy: compact
          delete.retention.ms: 0
          confluent.value.schema.validation: 'true'

components:
  messages:
    ExampleMessage:
      title: Example Message
      summary: This message has a reference to another schema
      schemaFormat: application/vnd.apache.avro;version=1.9.0
      payload:
        $ref: '../schemas/ExampleMessage.avsc'
      x-schemaReferences:
        - another.AnotherMessage

    AnotherMessage:
      schemaFormat: application/vnd.apache.avro+yaml;version=1.9.0
      payload:
        $ref: './schema/AnotherMessage.avsc'

  securitySchemes:
    confluentBroker:
      type: userPassword
      x-configs:
        security.protocol: sasl_ssl
        sasl.mechanisms: PLAIN
        sasl.username: '{{ CLUSTER_API_KEY }}'
        sasl.password: '{{ CLUSTER_API_SECRET }}'

    confluentSchemaRegistry:
      type: userPassword
      x-configs:
        basic.auth.user.info: '{{ SCHEMA_REGISTRY_API_KEY }}:{{ SCHEMA_REGISTRY_API_SECRET }}'

```

## Channel Messages
The AsyncApi 2.1.0 only allows to specify messages for consumers and producers. The extension allows to specify message and message compatibility for a channel. When specified for the channel, the schema will be registered for the topic with the subject `<channel-name>-value`.

## Topic Configuration Parameters
Kafka binding accepts the following fields

|Name|Description|
|---|---|
|x-partitions|Number of topic partitions.|
|x-replicas|Number of partition replicas for this topic.|
|x-configs|Additional configs to use for the topic. Use key/value as described in the documentation https://docs.confluent.io/platform/current/installation/configuration/topic-configs.html|

## Schema References
Schema registry allows referencing other schemas already defined in the registry as part of the schema definition. The references however have to be explicitly defined when registering your schema definition.

To list other schema that the message references, list them using `x-schemaReferences` field.
