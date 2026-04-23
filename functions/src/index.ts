import * as admin from 'firebase-admin';
import { setGlobalOptions } from 'firebase-functions/v2';
import { REGION } from './config/config';

admin.initializeApp();
setGlobalOptions({ region: REGION });

export { lookupUserByEmail } from './users/lookupUserByEmail';
export { notify } from './notifications/receiveNotification';
