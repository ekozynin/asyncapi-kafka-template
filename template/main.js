import { File } from '@asyncapi/generator-react-sdk';

export default function({ asyncapi, params }) {
  return ([
    <File name="main.py">
      { createIndexFile() }
    </File>
  ]);
}

function createIndexFile() {
  return `import logging
logging.basicConfig(level=logging.INFO)

from topics import topics
from schemas import schemas

topics.main()
schemas.main()

`;
}