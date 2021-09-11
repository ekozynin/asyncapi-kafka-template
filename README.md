![Confluent Kafka logo](./docos/confluent-kafka.png) 

# Confluent Kafka generator

This template will generate python scripts to create kafka topology in an existing Kafka cluster based on your AsyncApi.

The following Confluent Kafka components can be defined using AsyncApi specification:
- topics
- schema definitions
- [TODO] connectors
- [TODO] KSql


__Table of Contents__

<!-- toc -->

- [Usage](#usage)
- [Run it](#run-it)
- [Special Considerations](#special-considerations)
  * [Servers](#servers)
  * [Security](#security)
    + [Environment variables](#environment-variables)
- [AsyncApi Extensions](#asyncapi-extensions)
- [Contributors](#contributors)

<!-- tocstop -->

## Usage

```bash
  Usage: ag [options] <asyncapi.yaml> @ekozynin/asyncapi-kafka-template

  Options:
    --force-write               force writing of the generated files to given directory (defaults to false)
    -o, --output <outputDir>    directory where to put the generated files (defaults to current directory)
```

## Run it

The generated scripts were tested with python 3.9.7

Go to the root folder of the generated code and run this command (you need python):
```bash
  Usage: python main.py -e <environment>

  Options:
    environment   one of the "servers" definitions in your asyncapi file
```

First time you may need to install additional python dependencies. Go to the root folder of the generated code and install required python dependencies:

```bash
pip install -U -r python-requirements.txt
```

## Special Considerations

### Servers
Kafka cluster usually has different components to deploy Kafka topology to: brokers, schema registry, connectors, KSql.

To name the servers follow this rules:
- server name should start with the environment name (such as local, dev, prod)
- followed by dash '-'
- followed by component type. One of: 'broker', 'schemaRegistry'

### Security

To connect to Confluent Cloud Cluster, the servers above should have 'security' attribute defined. Security schemas must be defined exactly as below. [Refer to full example.](./examples)

```yaml
components:
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

#### Environment variables
Use environment variables to pass security details when deploying kafka topology.

The names for environment variables are:
- CLUSTER_API_KEY
- CLUSTER_API_SECRET
- SCHEMA_REGISTRY_API_KEY
- SCHEMA_REGISTRY_API_SECRET

## AsyncApi Extensions
[Additional extensions to the AsyncApi specification that this generator understands.](./EXTENSIONS.md)

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/ekozynin"><img src="https://avatars.githubusercontent.com/u/4666186?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Eugen Kozynin</b></sub></a><br /><a href="https://github.com/ekozynin/asyncapi-kafka-template/commits?author=ekozynin" title="Code">💻</a> <a href="https://github.com/ekozynin/asyncapi-kafka-template/commits?author=ekozynin" title="Documentation">📖</a> <a href="#design-ekozynin" title="Design">🎨</a> <a href="#ideas-ekozynin" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-ekozynin" title="Maintenance">🚧</a></td>
    <td align="center"><a href="https://github.com/Bazza95"><img src="https://avatars.githubusercontent.com/u/14013264?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jake Bayer</b></sub></a><br /><a href="https://github.com/ekozynin/asyncapi-kafka-template/commits?author=Bazza95" title="Code">💻</a> <a href="https://github.com/ekozynin/asyncapi-kafka-template/pulls?q=is%3Apr+reviewed-by%3ABazza95" title="Reviewed Pull Requests">👀</a> <a href="#ideas-Bazza95" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->