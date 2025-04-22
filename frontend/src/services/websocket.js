import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { API_ENDPOINTS } from '../config/api';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.subscriptions = new Map();
        this.friendSubscriptions = new Map();
        this.messageSubscriptions = new Map();
        this.connected = false;
        this.connectPromise = null;
        this.connectionAttempts = 0;
        this.maxAttempts = 5;
        this.reconnectTimeout = null;
        this.reconnectDelay = 5000;
    }

    async connect() {
        // If already connected, just return
        if (this.connected && this.stompClient) {
            console.log('WebSocket already connected, reusing connection');
            return Promise.resolve();
        }

        // If connection is in progress, return the existing promise
        if (this.connectPromise) {
            console.log('WebSocket connection in progress, waiting for it to complete');
            return this.connectPromise;
        }

        console.log('Starting new WebSocket connection');

        this.connectPromise = new Promise((resolve, reject) => {
            try {
                if (this.connectionAttempts >= this.maxAttempts) {
                    console.log('Max connection attempts reached, resetting connection');
                    this.resetConnection();
                    this.connectionAttempts = 0; // Reset attempts to allow future connections
                    reject(new Error('Max connection attempts reached'));
                    return;
                }

                this.connectionAttempts++;
                console.log(`Connection attempt ${this.connectionAttempts} of ${this.maxAttempts}`);

                // Tạo một SockJS socket mới
                const socket = new SockJS(API_ENDPOINTS.WS_URL);

                // Thêm xử lý lỗi cho socket
                socket.onerror = (error) => {
                    console.error('SockJS socket error:', error);
                };

                this.stompClient = new Client({
                    webSocketFactory: () => socket,
                    debug: (str) => {
                        // Chỉ log các thông báo quan trọng để tránh spam console
                        if (str.includes('CONNECT') || str.includes('ERROR') || str.includes('DISCONNECT')) {
                            console.log('WebSocket Debug:', str);
                        }
                    },
                    reconnectDelay: this.reconnectDelay,
                    heartbeatIncoming: 25000,
                    heartbeatOutgoing: 25000,
                    onConnect: () => {
                        console.log('WebSocket Connected Successfully');
                        this.connected = true;
                        this.connectionAttempts = 0; // Reset attempts on successful connection
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
                        this.connected = false;
                        this.connectPromise = null;

                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        } else {
                            this.resetConnection();
                            reject(frame);
                        }
                    },
                    onWebSocketClose: () => {
                        console.log('WebSocket Connection Closed');
                        this.connected = false;
                        this.connectPromise = null;

                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        }
                    },
                    onWebSocketError: (event) => {
                        console.error('WebSocket Error:', event);
                        this.connected = false;
                        this.connectPromise = null;

                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        }
                    }
                });

                // Kích hoạt kết nối
                console.log('Activating STOMP client...');
                this.stompClient.activate();
            } catch (error) {
                console.error('WebSocket Connection error:', error);
                this.connected = false;
                this.connectPromise = null;

                if (this.connectionAttempts < this.maxAttempts) {
                    this.reconnectWithDelay();
                } else {
                    this.resetConnection();
                    reject(error);
                }
            }
        });

        return this.connectPromise;
    }

    resetConnection() {
        console.log('Resetting WebSocket connection');
        this.connected = false;
        this.connectPromise = null;

        // Không reset connectionAttempts để tránh kết nối lại vô hạn nếu đã đạt số lần tối đa
        // this.connectionAttempts = 0;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.stompClient) {
            try {
                // Save current subscriptions before deactivating
                const currentSubscriptions = new Map(this.subscriptions);
                const currentFriendSubscriptions = new Map(this.friendSubscriptions);
                const currentMessageSubscriptions = new Map(this.messageSubscriptions);

                // Clear subscriptions maps before deactivating
                this.subscriptions.clear();
                this.friendSubscriptions.clear();
                this.messageSubscriptions.clear();

                // Deactivate client
                this.stompClient.deactivate();
                console.log('STOMP client deactivated');

                // Restore subscription maps for resubscribing later
                this.subscriptions = currentSubscriptions;
                this.friendSubscriptions = currentFriendSubscriptions;
                this.messageSubscriptions = currentMessageSubscriptions;
            } catch (e) {
                console.error('Error deactivating STOMP client:', e);
                // Clear subscriptions on error
                this.subscriptions.clear();
                this.friendSubscriptions.clear();
                this.messageSubscriptions.clear();
            } finally {
                this.stompClient = null;
            }
        }
    }

    reconnectWithDelay() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        // Tăng thời gian chờ theo số lần thử (exponential backoff)
        // Nhưng giới hạn tối đa là 30 giây
        const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.connectionAttempts - 1), 30000);

        console.log(`Scheduling reconnect in ${delay}ms (Attempt ${this.connectionAttempts}/${this.maxAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            if (this.connectionAttempts < this.maxAttempts) {
                console.log(`Attempting to reconnect... (Attempt ${this.connectionAttempts + 1}/${this.maxAttempts})`);
                this.connect().catch(error => {
                    console.error('Reconnect attempt failed:', error);
                });
            } else {
                console.log('Max reconnection attempts reached, giving up');
                // Reset connection attempts to allow future manual connections
                this.connectionAttempts = 0;
            }
        }, delay);
    }

    async resubscribeAll() {
        console.log('Resubscribing to all topics');

        // Resubscribe to posts
        const subscriptions = new Map(this.subscriptions);
        const tempSubscriptions = new Map(this.subscriptions);
        this.subscriptions.clear();

        console.log(`Resubscribing to ${subscriptions.size} posts`);
        for (const [postId, { callback }] of subscriptions) {
            try {
                await this.subscribeToPost(postId, callback);
                console.log(`Successfully resubscribed to post: ${postId}`);
            } catch (error) {
                console.error(`Failed to resubscribe to post ${postId}:`, error);
                // Restore the original subscription in the map
                this.subscriptions.set(postId, tempSubscriptions.get(postId));
            }
        }

        // Resubscribe to friend updates
        const friendSubscriptions = new Map(this.friendSubscriptions);
        const tempFriendSubscriptions = new Map(this.friendSubscriptions);
        this.friendSubscriptions.clear();

        console.log(`Resubscribing to ${friendSubscriptions.size} friend updates`);
        for (const [userId, { callback }] of friendSubscriptions) {
            try {
                await this.subscribeToFriendUpdates(userId, callback);
                console.log(`Successfully resubscribed to friend updates for user: ${userId}`);
            } catch (error) {
                console.error(`Failed to resubscribe to friend updates for user ${userId}:`, error);
                // Restore the original subscription in the map
                this.friendSubscriptions.set(userId, tempFriendSubscriptions.get(userId));
            }
        }

        // Resubscribe to message updates
        const messageSubscriptions = new Map(this.messageSubscriptions);
        const tempMessageSubscriptions = new Map(this.messageSubscriptions);
        this.messageSubscriptions.clear();

        console.log(`Resubscribing to ${messageSubscriptions.size} message updates`);
        for (const [userId, { callback }] of messageSubscriptions) {
            try {
                await this.subscribeToMessages(userId, callback);
                console.log(`Successfully resubscribed to messages for user: ${userId}`);
            } catch (error) {
                console.error(`Failed to resubscribe to messages for user ${userId}:`, error);
                // Restore the original subscription in the map
                this.messageSubscriptions.set(userId, tempMessageSubscriptions.get(userId));
            }
        }

        console.log('Resubscription complete');
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

    async subscribeToFriendUpdates(userId, callback) {
        if (!userId || !callback) {
            console.error('Invalid userId or callback for friend updates subscription');
            return;
        }

        if (this.friendSubscriptions.has(userId)) {
            console.log(`Already subscribed to friend updates for user: ${userId}`);
            return;
        }

        try {
            if (!this.connected) {
                console.log(`WebSocket not connected, connecting for user: ${userId}`);
                await this.connect();
            }

            console.log(`Subscribing to friend updates for user: ${userId}`);
            const subscription = this.stompClient.subscribe(`/topic/friends/${userId}`, message => {
                try {
                    const data = JSON.parse(message.body);
                    console.log(`Received friend update for user ${userId}:`, data);
                    console.log('Friend update type:', data.type);
                    console.log('Friend update data:', data);

                    // Debug: Log the callback function
                    console.log('Callback function exists:', !!callback);

                    // Call the callback with the data
                    callback(data);

                    // Debug: Log after callback
                    console.log('Callback executed for friend update');
                } catch (error) {
                    console.error('Error parsing friend update message:', error);
                }
            });

            console.log(`Successfully subscribed to friend updates for user: ${userId}`);
            this.friendSubscriptions.set(userId, { callback, subscription });
            console.log('Current friend subscriptions:', [...this.friendSubscriptions.keys()]);
        } catch (error) {
            console.error(`Failed to subscribe to friend updates for user ${userId}:`, error);
            // Try to reconnect on subscription failure
            this.reconnectWithDelay();
        }
    }

    unsubscribeFromFriendUpdates(userId) {
        const sub = this.friendSubscriptions.get(userId);
        if (sub && sub.subscription) {
            try {
                console.log(`Unsubscribing from friend updates for user: ${userId}`);
                sub.subscription.unsubscribe();
            } catch (e) {
                console.error(`Error unsubscribing from friend updates for user ${userId}:`, e);
            }
            this.friendSubscriptions.delete(userId);
        }
    }

    async subscribeToMessages(userId, callback) {
        if (!userId || !callback) {
            console.error('Invalid userId or callback for message subscription');
            return;
        }

        if (this.messageSubscriptions.has(userId)) {
            console.log(`Already subscribed to messages for user: ${userId}`);
            return;
        }

        try {
            if (!this.connected) {
                console.log(`WebSocket not connected, connecting for messages to user: ${userId}`);
                await this.connect();
            }

            console.log(`Subscribing to messages for user: ${userId}`);
            const subscription = this.stompClient.subscribe(`/topic/messages/${userId}`, message => {
                try {
                    const data = JSON.parse(message.body);
                    console.log(`Received message for user ${userId}:`, data);
                    callback(data);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            console.log(`Successfully subscribed to messages for user: ${userId}`);
            this.messageSubscriptions.set(userId, { callback, subscription });
        } catch (error) {
            console.error(`Failed to subscribe to messages for user ${userId}:`, error);
            this.reconnectWithDelay();
        }
    }

    unsubscribeFromMessages(userId) {
        const sub = this.messageSubscriptions.get(userId);
        if (sub && sub.subscription) {
            try {
                console.log(`Unsubscribing from messages for user: ${userId}`);
                sub.subscription.unsubscribe();
            } catch (e) {
                console.error(`Error unsubscribing from messages for user ${userId}:`, e);
            }
            this.messageSubscriptions.delete(userId);
        }
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.stompClient) {
            console.log('Disconnecting WebSocket');
            // Unsubscribe from posts
            this.subscriptions.forEach((sub) => {
                if (sub.subscription) {
                    try {
                        sub.subscription.unsubscribe();
                    } catch (e) {
                        console.error('Error unsubscribing from post:', e);
                    }
                }
            });
            this.subscriptions.clear();

            // Unsubscribe from friend updates
            this.friendSubscriptions.forEach((sub) => {
                if (sub.subscription) {
                    try {
                        sub.subscription.unsubscribe();
                    } catch (e) {
                        console.error('Error unsubscribing from friend updates:', e);
                    }
                }
            });
            this.friendSubscriptions.clear();

            // Unsubscribe from message updates
            this.messageSubscriptions.forEach((sub) => {
                if (sub.subscription) {
                    try {
                        sub.subscription.unsubscribe();
                    } catch (e) {
                        console.error('Error unsubscribing from messages:', e);
                    }
                }
            });
            this.messageSubscriptions.clear();

            this.resetConnection();
        }
    }
}

export const webSocketService = new WebSocketService();




