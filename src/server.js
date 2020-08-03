'use strict';

import { createSecureServer, constants } from 'http2';
import { Transform } from 'stream';

export class SseServingStream extends Transform {
  /**
   * @type {import('http2').Http2SecureServer}
   */
  #server;

  #id = 0;

  /**
   * @param {import('http2').SecureServerOptions['key']} key
   * @param {import('http2').SecureServerOptions['cert']} cert
   * @param {string} [endpoint]
   * @param {any[]} initialState - initial state to stream on client connection
   * @param {string | number} [port]
   */
  constructor(
    key,
    cert,
    endpoint = '/sse/',
    initialState,
    port = process.env.PORT || 3001
  ) {
    super({ objectMode: true, highWaterMark: 1 });

    this.#server = createSecureServer({
      key,
      cert,
    })
      .on('stream', (stream, headers) => {
        if (headers[constants.HTTP2_HEADER_PATH] === endpoint) {
          console.log('Stream');
          stream.respond({
            [constants.HTTP2_HEADER_STATUS]: constants.HTTP_STATUS_OK,
            [constants.HTTP2_HEADER_CONTENT_TYPE]: 'text/event-stream',
            [constants.HTTP2_HEADER_CACHE_CONTROL]: 'no-cache, no-store',
          });
          stream.write(JSON.stringify(initialState));
          this.pipe(stream);
        }
      })
      .on('request', (req) => {
        console.log('Request');
        req.socket.setTimeout(0);
        req.socket.setNoDelay(true);
        req.socket.setKeepAlive(true);
      })
      .setTimeout(0);
    this.#server.listen(port, () => {
      console.log('Server is listening on port %d', port);
    });
  }

  _transform(data, enconding, callback) {
    if (data.id) {
      this.push(`id: ${data.id}\n`);
    } else {
      this.push(`id: ${this.#id++}\n`);
    }
    if (data.event) {
      this.push(`event: ${data.event}\n`);
    }
    this.push('data: ');
    this.push(JSON.stringify(data.data));
    this.push('\n\n');
    callback();
  }

  _destroy() {
    this.#server.close();
  }
}
