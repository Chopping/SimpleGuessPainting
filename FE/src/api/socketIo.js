import io from 'socket.io-client';
import { env } from '../config';

const socket = env === 'develop' ? io('//0.0.0.0:7777') : io('//nossika.com', {
    path: '/io/socket.io'
});

export default socket;