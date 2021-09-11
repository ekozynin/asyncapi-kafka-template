import { File } from '@asyncapi/generator-react-sdk';

export default function() {
  return ([
    <File name="README.md">
      {createReadme()}
    </File>
  ]);
}

function createReadme() {
  return `
## Install python dependencies

\`pip install -r python-requirements.txt\`
    `;
}