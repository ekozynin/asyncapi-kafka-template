import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi, params }) {
  return ([
    <File name="register_schema.py">
      { registerSchema() }
    </File>
  ]);
}

function registerSchema() {
  return `import logging, sys
import json

from graphlib import TopologicalSorter

from confluent_kafka.schema_registry import Schema, SchemaReference
from confluent_kafka.schema_registry.error import SchemaRegistryError

schemas_dict = {}

### ----- add_schema()
def add_schema(schema_name, schema_format, schema_payload, compatibility_level = 'FULL', schema_references = None):
    schema_type = None
    if (schema_format.startswith('application/vnd.apache.avro')):
        schema_type = 'AVRO';
    elif (schema_format.startswith('application/x-protobuf')):
        schema_type = 'PROTOBUF';
    elif (schema_format.startswith('application/schema')):
        schema_type = 'JSON';
    else:
        logging.error("Unknown schema format {}".format(schema_format))
        sys.exit(2)

    if schema_type != 'AVRO':
        logging.error("Only AVRO schemas are currently supported")
        sys.exit(2)

    references = []
    if schema_references:
        for reference in schema_references:
            # setting version to '0' as it will later be overridden with the actual schema version from the schema registry
            references.append(SchemaReference(name=reference, subject=reference, version=0))

    schema = Schema(schema_str=schema_payload, schema_type=schema_type, references=references)

    logging.debug("Appending {} schema to the list".format(schema_name))
    schemas_dict[schema_name] = {'schema_name': schema_name,
                                    'schema': schema,
                                    'compatibility_level': compatibility_level}
### ----- END add_schema()


### ----- sort_schemas()
# Schemas may have references to other schemas, so we need to build a dependency graph
# and create schemas in the right order in the schema registry
def sort_schemas(schemas_dict):
    topological_sorter = TopologicalSorter()

    for schema_name, value in schemas_dict.items():
        references = value["schema"].references

        topological_sorter.add(schema_name)

        for reference in references:
            topological_sorter.add(reference.subject, schema_name)

    sorted_schemas = []
    for key in topological_sorter.static_order():
        sorted_schemas.insert(0, schemas_dict[key])

    return sorted_schemas
### ----- END sort_schemas()


### ----- register_schemas()
def register_schemas(schema_registry_client):
    sorted_schemas = sort_schemas(schemas_dict)

    schema_versions_dict = {}

    for entry in sorted_schemas:
        schema = entry['schema']
        schema_name = entry['schema_name']
        compatibility_level = entry['compatibility_level']

        try:
            # update versions of schema references, if any
            for reference in schema.references:
                reference.version = schema_versions_dict[reference.subject]
                logging.debug("Setting {}'s {} reference version to {}".format(schema_name, reference.name, schema_versions_dict[reference.subject]))

            # registering schema
            schema_id = schema_registry_client.register_schema(schema_name, schema)

            # retrieving the latest registered schema to check the version number
            schema_version = schema_registry_client.lookup_schema(schema_name, schema).version
            schema_versions_dict[schema_name] = schema_version

            logging.info('Schema {} has been registered with the id {} version {}'.format(schema_name, schema_id, schema_version))
        except SchemaRegistryError as e:
            logging.error("Failed to register schema {}: {}".format(schema_name, e))
            sys.exit(2)

        logging.debug('Setting schema compatibility level to {} for {}'.format(compatibility_level, schema_name))
        try:
            resultCompatibilityLevel = schema_registry_client.set_compatibility(schema_name, compatibility_level)
            logging.info('Topic {} schema compatibility level is {}'.format(schema_name, resultCompatibilityLevel['compatibility']))
        except SchemaRegistryError as e:
            logging.error("Failed to set schema compatibility for schema {} to {} level: {}".format(schema_name, compatibility_level, e))
            sys.exit(2)
### ----- END register_schemas()
  `;
}

module.exports = { registerSchema };