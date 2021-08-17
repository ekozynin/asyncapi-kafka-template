import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi, params }) {
  const bootstrapServers = 'localhost:9092'; // TODO
  const schemaRegistry = 'http://localhost:8081'; // TODO

  return ([
    <File name="main.py">
      { createIndexFile(bootstrapServers, schemaRegistry) }
    </File>
  ]);
}

function createIndexFile(bootstrapServers, schemaRegistry) {
  return `import logging

from confluent_kafka.admin import AdminClient
from confluent_kafka.schema_registry import SchemaRegistryClient

from topics import topics
from schemas import schemas

logging.basicConfig(level=logging.INFO)

logging.debug("Creating AdminClient with bootstrap.servers ${bootstrapServers}")
admin_client = AdminClient({"bootstrap.servers": "${bootstrapServers}"})

logging.debug("Creating SchemaRegistryClient with schemaRegistryUrl ${schemaRegistry}")
schema_registry_client = SchemaRegistryClient({"url": "${schemaRegistry}"})

topics.main(admin_client, schema_registry_client)
schemas.main()

`;
}