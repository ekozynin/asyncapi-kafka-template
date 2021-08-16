import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi }) {
  const channels = asyncapi.channels();

  return [
    <File name='topics.py'>
      {createIndexFile(channels)}
    </File>
  ];
}

function createIndexFile(channels) {
  const fileNames = [];

  Object.entries(channels)
    .map(([channelName, channel]) => {
      const fileName = channelName.replace(/\./g, '_').replace(/-/g, '_');

      fileNames.push(fileName);
      return `from .${fileName} import main as ${fileName}_main`;
    });

  return `import logging

${ fileNames.map(fileName => `from .${fileName} import main as ${fileName}_main`).join('\n') }

### ----- main()
def main():
    ${ fileNames.map(fileName => `${fileName}_main()`).join('; ') }
### ----- END main()

  `;
}
