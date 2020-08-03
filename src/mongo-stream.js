import mongodb from 'mongodb';
import { SseServingStream } from './server.js';
import { readFileSync } from 'fs';
import { Transform } from 'stream';

const {
  MONGOHQ_URL = 'mongodb+srv://tino:6VUFWcLLhLaVDeTs@cluster0-sszzh.azure.mongodb.net/test-entities?readOnly=true',
} = process.env;
const MONGO_COLLECTION_NAME = 'entities';
const initialState = [];

const mongo = await mongodb.MongoClient.connect(MONGOHQ_URL, {
  useUnifiedTopology: true,
  readPreference: 'nearest', // 💪🏻
});
mongo
  .db()
  .collection(MONGO_COLLECTION_NAME)
  .watch([{ $match: { operationType: { $in: ['insert', 'update'] } } }], {
    fullDocument: 'updateLookup',
  })
  //#region Transform
  .pipe(
    new Transform({
      objectMode: true,
      highWaterMark: 1,
      transform(chunk, encoding, callback) {
        const { operationType, fullDocument } = chunk;
        console.log('[API] %s of: %s', operationType, fullDocument.id);
        const entity = [fullDocument.id, ...fullDocument.parameters];
        this.push({ event: operationType, data: entity });
        callback();

        // update initial content for SSE
        switch (operationType) {
          case 'update': {
            const index = initialState.findIndex(
              ([entityName]) => entityName === fullDocument.id
            );
            if (index) {
              // remove old version
              initialState.splice(index, 1);
            }
          }

          // added new entity to the top of initials, maintaining it sorted
          // eslint-disable-next-line no-fallthrough
          case 'insert':
            initialState.unshift(entity);
            break;
        }
      },
    })
  )
  //#endregion
  // #region Serve
  .pipe(
    new SseServingStream(
      readFileSync('certs/http2-sse+3-key.pem'),
      readFileSync('certs/http2-sse+3.pem'),
      '/sse/',
      initialState
    )
  );
//#endregion
