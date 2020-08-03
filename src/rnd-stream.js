import { Readable } from 'stream';
import { SseServingStream } from './server.js';
import { readFileSync } from 'fs';

const initialState = [];

//#region
Readable.from(
  (async function* generate() {
    do {
      yield { data: Array.from({ length: 5 }, () => Math.random()) };
      await new Promise((resolve) => setTimeout(resolve, 400));
    } while (true);
  })()
)
  // #endregion
  // #region
  .pipe(
    new SseServingStream(
      readFileSync('certs/http2-sse+3-key.pem'),
      readFileSync('certs/http2-sse+3.pem'),
      '/sse/',
      initialState
    )
  );
//#endregion
