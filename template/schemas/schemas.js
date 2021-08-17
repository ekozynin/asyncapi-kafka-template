import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi }) {
  const messages = asyncapi.allMessages();

  return [
    <File name='schemas.py'>
      {createIndexFile(messages)}
    </File>
  ];
}

function createIndexFile(messages) {
  const fileNames = [];

  messages.forEach((value, key, map) => {
    const fileName = `${key.replace(/\./g, '_').replace(/-/g, '_')}`;

    fileNames.push(fileName);
    return `from .${fileName} import main as ${fileName}_main`;
  });

  return `import logging

${ fileNames.map(fileName => `from .${fileName} import main as ${fileName}_main`).join('\n') }

### ----- main()
def main(schema_registry_client):
    ${ fileNames.map(fileName => `${fileName}_main(schema_registry_client)`).join('; ') }
### ----- END main()

  `;
}
