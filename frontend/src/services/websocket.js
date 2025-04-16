import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { API_ENDPOINTS } from '../config/api';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.subscriptions = new Map();
        this.connected = false;
        this.connectPromise = null;
        this.connectionAttempts = 0;
        this.maxAttempts = 5;
        this.reconnectTimeout = null;
        this.reconnectDelay = 5000;
    }

    async connect() {
        if (this.connected && this.stompClient) {
            return Promise.resolve();
        }

        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.connectPromise = new Promise((resolve, reject) => {
            try {
                if (this.connectionAttempts >= this.maxAttempts) {
                    this.resetConnection();
                    reject(new Error('Max connection attempts reached'));
                    return;
                }

                this.connectionAttempts++;
                const socket = new SockJS(API_ENDPOINTS.WS_URL);
                
                this.stompClient = new Client({
                    webSocketFactory: () => socket,
                    debug: (str) => {
                        console.log('WebSocket Debug:', str);
                    },
                    reconnectDelay: this.reconnectDelay,
                    heartbeatIncoming: 25000,
                    heartbeatOutgoing: 25000,
                    onConnect: () => {
                        console.log('WebSocket Connected Successfully');
                        this.connected = true;
                        this.connectionAttempts = 0;
                        this.connectPromise = null;
                        this.resubscribeAll();
                        resolve();
                    },
                    onDisconnect: () => {
                        console.log('WebSocket Disconnected');
                        this.connected = false;
                        this.connectPromise = null;
                        
                        // Chỉ thử kết nối lại nếu chưa đạt số lần tối đa
                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        }
                    },
                    onStompError: (frame) => {
                        console.error('STOMP Error:', frame);
                        this.resetConnection();
                        reject(frame);
                    },
                    onWebSocketClose: () => {
                        console.log('WebSocket Connection Closed');
                        this.connected = false;
                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        }
                    },
                    onWebSocketError: (event) => {
                        console.error('WebSocket Error:', event);
                        this.connected = false;
                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        }
                    }
                });

                this.stompClient.activate();
            } catch (error) {
                console.error('WebSocket Connection error:', error);
                this.resetConnection();
                reject(error);
            }
        });

        return this.connectPromise;
    }

    resetConnection() {
        this.connected = false;
        this.connectPromise = null;
        this.connectionAttempts = 0;
        if (this.stompClient) {
            try {
                this.stompClient.deactivate();
            } catch (e) {
                console.error('Error deactivating STOMP client:', e);
            }
            this.stompClient = null;
        }
    }

    reconnectWithDelay() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1), 30000);
        
        this.reconnectTimeout = setTimeout(() => {
            console.log(`Attempting to reconnect... (Attempt ${this.connectionAttempts + 1})`);
            this.connect().catch(console.error);
        }, delay);
    }

    async resubscribeAll() {
        const subscriptions = new Map(this.subscriptions);
        this.subscriptions.clear();
        
        for (const [postId, { callback }] of subscriptions) {
            await this.subscribeToPost(postId, callback);
        }
    }

    async subscribeToPost(postId, callback) {
        if (!postId || !callback) return;
        
        if (this.subscriptions.has(postId)) {
            return;
        }

        try {
            if (!this.connected) {
                await this.connect();
            }

            console.log(`Subscribing to post: ${postId}`);
            const subscription = this.stompClient.subscribe(`/topic/posts/${postId}`, message => {
                try {
                    const post = JSON.parse(message.body);
                    console.log(`Received update for post ${postId}:`, post);
                    callback(post);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
            this.subscriptions.set(postId, { callback, subscription });
        } catch (error) {
            console.error(`Failed to subscribe to post ${postId}:`, error);
            // Try to reconnect on subscription failure
            this.reconnectWithDelay();
        }
    }

    unsubscribeFromPost(postId) {
        const sub = this.subscriptions.get(postId);
        if (sub && sub.subscription) {
            try {
                console.log(`Unsubscribing from post: ${postId}`);
                sub.subscription.unsubscribe();
            } catch (e) {
                console.error(`Error unsubscribing from post ${postId}:`, e);
            }
            this.subscriptions.delete(postId);
        }
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        
        if (this.stompClient) {
            console.log('Disconnecting WebSocket');
            this.subscriptions.forEach((sub) => {
                if (sub.subscription) {
                    try {
                        sub.subscription.unsubscribe();
                    } catch (e) {
                        console.error('Error unsubscribing:', e);
                    }
                }
            });
            this.subscriptions.clear();
            this.resetConnection();
        }
    }
}

export const webSocketService = new WebSocketService();




