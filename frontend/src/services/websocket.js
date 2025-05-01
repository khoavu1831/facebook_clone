import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { API_ENDPOINTS } from '../config/api';

/**
 * Dịch vụ WebSocket để xử lý kết nối thời gian thực
 * Quản lý các kết nối và đăng ký cho bài viết, bạn bè, tin nhắn và thông báo
 */
class WebSocketService {
    constructor() {
        // Client STOMP
        this.stompClient = null;

        // Các Map lưu trữ đăng ký
        this.subscriptions = new Map(); // Đăng ký cho bài viết
        this.friendSubscriptions = new Map(); // Đăng ký cho cập nhật bạn bè
        this.messageSubscriptions = new Map(); // Đăng ký cho tin nhắn
        this.notificationSubscriptions = new Map(); // Đăng ký cho thông báo

        // Trạng thái kết nối
        this.connected = false;
        this.connectPromise = null;

        // Cấu hình kết nối lại
        this.connectionAttempts = 0;
        this.maxAttempts = 5;
        this.reconnectTimeout = null;
        this.reconnectDelay = 5000;
    }

    /**
     * Kết nối đến WebSocket server
     * @returns {Promise} Promise kết nối
     */
    async connect() {
        // Nếu đã kết nối, trả về ngay
        if (this.connected && this.stompClient) {
            return Promise.resolve();
        }

        // Nếu kết nối đang trong tiến trình, trả về promise hiện tại
        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.connectPromise = new Promise((resolve, reject) => {
            try {
                // Kiểm tra số lần thử kết nối
                if (this.connectionAttempts >= this.maxAttempts) {
                    this.resetConnection();
                    this.connectionAttempts = 0; // Reset số lần thử để cho phép kết nối trong tương lai
                    reject(new Error('Đã đạt số lần kết nối tối đa'));
                    return;
                }

                this.connectionAttempts++;

                // Tạo một SockJS socket mới
                const socket = new SockJS(API_ENDPOINTS.WS_URL);

                // Thêm xử lý lỗi cho socket
                socket.onerror = (error) => {
                    console.error('Lỗi SockJS socket:', error);
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
                        this.connected = true;
                        this.connectionAttempts = 0; // Reset số lần thử khi kết nối thành công
                        this.connectPromise = null;
                        this.resubscribeAll();
                        resolve();
                    },
                    onDisconnect: () => {
                        this.connected = false;
                        this.connectPromise = null;

                        // Chỉ thử kết nối lại nếu chưa đạt số lần tối đa
                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        }
                    },
                    onStompError: (frame) => {
                        console.error('Lỗi STOMP:', frame);
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
                        this.connected = false;
                        this.connectPromise = null;

                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        }
                    },
                    onWebSocketError: (event) => {
                        console.error('Lỗi WebSocket:', event);
                        this.connected = false;
                        this.connectPromise = null;

                        if (this.connectionAttempts < this.maxAttempts) {
                            this.reconnectWithDelay();
                        }
                    }
                });

                // Kích hoạt kết nối
                this.stompClient.activate();
            } catch (error) {
                console.error('Lỗi kết nối WebSocket:', error);
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

    /**
     * Đặt lại kết nối WebSocket
     */
    resetConnection() {
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
                // Lưu các đăng ký hiện tại trước khi hủy kích hoạt
                const currentSubscriptions = new Map(this.subscriptions);
                const currentFriendSubscriptions = new Map(this.friendSubscriptions);
                const currentMessageSubscriptions = new Map(this.messageSubscriptions);
                const currentNotificationSubscriptions = new Map(this.notificationSubscriptions);

                // Xóa các map đăng ký trước khi hủy kích hoạt
                this.subscriptions.clear();
                this.friendSubscriptions.clear();
                this.messageSubscriptions.clear();
                this.notificationSubscriptions.clear();

                // Hủy kích hoạt client
                this.stompClient.deactivate();

                // Khôi phục các map đăng ký để đăng ký lại sau
                this.subscriptions = currentSubscriptions;
                this.friendSubscriptions = currentFriendSubscriptions;
                this.messageSubscriptions = currentMessageSubscriptions;
                this.notificationSubscriptions = currentNotificationSubscriptions;
            } catch (e) {
                console.error('Lỗi khi hủy kích hoạt STOMP client:', e);
                // Xóa các đăng ký khi có lỗi
                this.subscriptions.clear();
                this.friendSubscriptions.clear();
                this.messageSubscriptions.clear();
                this.notificationSubscriptions.clear();
            } finally {
                this.stompClient = null;
            }
        }
    }

    /**
     * Kết nối lại với độ trễ tăng dần
     */
    reconnectWithDelay() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        // Tăng thời gian chờ theo số lần thử (exponential backoff)
        // Nhưng giới hạn tối đa là 30 giây
        const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.connectionAttempts - 1), 30000);

        this.reconnectTimeout = setTimeout(() => {
            if (this.connectionAttempts < this.maxAttempts) {
                this.connect().catch(error => {
                    console.error('Lỗi khi thử kết nối lại:', error);
                });
            } else {
                // Reset số lần thử kết nối để cho phép kết nối thủ công trong tương lai
                this.connectionAttempts = 0;
            }
        }, delay);
    }

    /**
     * Đăng ký lại tất cả các chủ đề sau khi kết nối lại
     */
    async resubscribeAll() {
        // Đăng ký lại cho bài viết
        const subscriptions = new Map(this.subscriptions);
        const tempSubscriptions = new Map(this.subscriptions);
        this.subscriptions.clear();

        for (const [postId, { callback }] of subscriptions) {
            try {
                await this.subscribeToPost(postId, callback);
            } catch (error) {
                console.error(`Lỗi khi đăng ký lại bài viết ${postId}:`, error);
                // Khôi phục đăng ký gốc trong map
                this.subscriptions.set(postId, tempSubscriptions.get(postId));
            }
        }

        // Đăng ký lại cho cập nhật bạn bè
        const friendSubscriptions = new Map(this.friendSubscriptions);
        const tempFriendSubscriptions = new Map(this.friendSubscriptions);
        this.friendSubscriptions.clear();

        for (const [userId, { callback }] of friendSubscriptions) {
            try {
                await this.subscribeToFriendUpdates(userId, callback);
            } catch (error) {
                console.error(`Lỗi khi đăng ký lại cập nhật bạn bè cho người dùng ${userId}:`, error);
                // Khôi phục đăng ký gốc trong map
                this.friendSubscriptions.set(userId, tempFriendSubscriptions.get(userId));
            }
        }

        // Đăng ký lại cho cập nhật tin nhắn
        const messageSubscriptions = new Map(this.messageSubscriptions);
        const tempMessageSubscriptions = new Map(this.messageSubscriptions);
        this.messageSubscriptions.clear();

        for (const [userId, { callback }] of messageSubscriptions) {
            try {
                await this.subscribeToMessages(userId, callback);
            } catch (error) {
                console.error(`Lỗi khi đăng ký lại tin nhắn cho người dùng ${userId}:`, error);
                // Khôi phục đăng ký gốc trong map
                this.messageSubscriptions.set(userId, tempMessageSubscriptions.get(userId));
            }
        }

        // Đăng ký lại cho cập nhật thông báo
        const notificationSubscriptions = new Map(this.notificationSubscriptions);
        const tempNotificationSubscriptions = new Map(this.notificationSubscriptions);
        this.notificationSubscriptions.clear();

        for (const [userId, { callback }] of notificationSubscriptions) {
            try {
                await this.subscribeToNotifications(userId, callback);
            } catch (error) {
                console.error(`Lỗi khi đăng ký lại thông báo cho người dùng ${userId}:`, error);
                // Khôi phục đăng ký gốc trong map
                this.notificationSubscriptions.set(userId, tempNotificationSubscriptions.get(userId));
            }
        }
    }

    /**
     * Đăng ký nhận cập nhật cho một bài viết
     * @param {string} postId ID của bài viết
     * @param {Function} callback Hàm callback xử lý khi nhận được cập nhật
     */
    async subscribeToPost(postId, callback) {
        if (!postId || !callback) return;

        if (this.subscriptions.has(postId)) {
            return;
        }

        try {
            if (!this.connected) {
                await this.connect();
            }

            const subscription = this.stompClient.subscribe(`/topic/posts/${postId}`, message => {
                try {
                    const post = JSON.parse(message.body);
                    callback(post);
                } catch (error) {
                    console.error('Lỗi khi phân tích tin nhắn:', error);
                }
            });
            this.subscriptions.set(postId, { callback, subscription });
        } catch (error) {
            console.error(`Lỗi khi đăng ký bài viết ${postId}:`, error);
            // Thử kết nối lại khi đăng ký thất bại
            this.reconnectWithDelay();
        }
    }

    /**
     * Hủy đăng ký cập nhật cho một bài viết
     * @param {string} postId ID của bài viết
     */
    unsubscribeFromPost(postId) {
        const sub = this.subscriptions.get(postId);
        if (sub && sub.subscription) {
            try {
                sub.subscription.unsubscribe();
            } catch (e) {
                console.error(`Lỗi khi hủy đăng ký bài viết ${postId}:`, e);
            }
            this.subscriptions.delete(postId);
        }
    }

    /**
     * Đăng ký nhận cập nhật về bạn bè cho một người dùng
     * @param {string} userId ID của người dùng
     * @param {Function} callback Hàm callback xử lý khi nhận được cập nhật
     */
    async subscribeToFriendUpdates(userId, callback) {
        if (!userId || !callback) {
            console.error('ID người dùng hoặc callback không hợp lệ cho đăng ký cập nhật bạn bè');
            return;
        }

        if (this.friendSubscriptions.has(userId)) {
            return;
        }

        try {
            if (!this.connected) {
                await this.connect();
            }

            const subscription = this.stompClient.subscribe(`/topic/friends/${userId}`, message => {
                try {
                    const data = JSON.parse(message.body);
                    callback(data);
                } catch (error) {
                    console.error('Lỗi khi phân tích tin nhắn cập nhật bạn bè:', error);
                }
            });

            this.friendSubscriptions.set(userId, { callback, subscription });
        } catch (error) {
            console.error(`Lỗi khi đăng ký cập nhật bạn bè cho người dùng ${userId}:`, error);
            // Thử kết nối lại khi đăng ký thất bại
            this.reconnectWithDelay();
        }
    }

    /**
     * Hủy đăng ký cập nhật bạn bè cho một người dùng
     * @param {string} userId ID của người dùng
     */
    unsubscribeFromFriendUpdates(userId) {
        const sub = this.friendSubscriptions.get(userId);
        if (sub && sub.subscription) {
            try {
                sub.subscription.unsubscribe();
            } catch (e) {
                console.error(`Lỗi khi hủy đăng ký cập nhật bạn bè cho người dùng ${userId}:`, e);
            }
            this.friendSubscriptions.delete(userId);
        }
    }

    /**
     * Đăng ký nhận tin nhắn cho một người dùng
     * @param {string} userId ID của người dùng
     * @param {Function} callback Hàm callback xử lý khi nhận được tin nhắn
     */
    async subscribeToMessages(userId, callback) {
        if (!userId || !callback) {
            console.error('ID người dùng hoặc callback không hợp lệ cho đăng ký tin nhắn');
            return;
        }

        if (this.messageSubscriptions.has(userId)) {
            return;
        }

        try {
            if (!this.connected) {
                await this.connect();
            }

            const subscription = this.stompClient.subscribe(`/topic/messages/${userId}`, message => {
                try {
                    const data = JSON.parse(message.body);
                    callback(data);
                } catch (error) {
                    console.error('Lỗi khi phân tích tin nhắn:', error);
                }
            });

            this.messageSubscriptions.set(userId, { callback, subscription });
        } catch (error) {
            console.error(`Lỗi khi đăng ký tin nhắn cho người dùng ${userId}:`, error);
            this.reconnectWithDelay();
        }
    }

    /**
     * Hủy đăng ký tin nhắn cho một người dùng
     * @param {string} userId ID của người dùng
     */
    unsubscribeFromMessages(userId) {
        const sub = this.messageSubscriptions.get(userId);
        if (sub && sub.subscription) {
            try {
                sub.subscription.unsubscribe();
            } catch (e) {
                console.error(`Lỗi khi hủy đăng ký tin nhắn cho người dùng ${userId}:`, e);
            }
            this.messageSubscriptions.delete(userId);
        }
    }

    /**
     * Đăng ký nhận thông báo cho một người dùng
     * @param {string} userId ID của người dùng
     * @param {Function} callback Hàm callback xử lý khi nhận được thông báo
     */
    async subscribeToNotifications(userId, callback) {
        if (!userId || !callback) {
            console.error('ID người dùng hoặc callback không hợp lệ cho đăng ký thông báo');
            return;
        }

        if (this.notificationSubscriptions.has(userId)) {
            return;
        }

        try {
            if (!this.connected) {
                await this.connect();
            }

            const subscription = this.stompClient.subscribe(`/topic/notifications/${userId}`, message => {
                try {
                    const data = JSON.parse(message.body);
                    callback(data);
                } catch (error) {
                    console.error('Lỗi khi phân tích thông báo:', error);
                }
            });

            this.notificationSubscriptions.set(userId, { callback, subscription });
        } catch (error) {
            console.error(`Lỗi khi đăng ký thông báo cho người dùng ${userId}:`, error);
            this.reconnectWithDelay();
        }
    }

    /**
     * Hủy đăng ký thông báo cho một người dùng
     * @param {string} userId ID của người dùng
     */
    unsubscribeFromNotifications(userId) {
        const sub = this.notificationSubscriptions.get(userId);
        if (sub && sub.subscription) {
            try {
                sub.subscription.unsubscribe();
            } catch (e) {
                console.error(`Lỗi khi hủy đăng ký thông báo cho người dùng ${userId}:`, e);
            }
            this.notificationSubscriptions.delete(userId);
        }
    }

    /**
     * Ngắt kết nối WebSocket và hủy tất cả các đăng ký
     */
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.stompClient) {
            // Hủy đăng ký từ bài viết
            this.subscriptions.forEach((sub) => {
                if (sub.subscription) {
                    try {
                        sub.subscription.unsubscribe();
                    } catch (e) {
                        console.error('Lỗi khi hủy đăng ký bài viết:', e);
                    }
                }
            });
            this.subscriptions.clear();

            // Hủy đăng ký từ cập nhật bạn bè
            this.friendSubscriptions.forEach((sub) => {
                if (sub.subscription) {
                    try {
                        sub.subscription.unsubscribe();
                    } catch (e) {
                        console.error('Lỗi khi hủy đăng ký cập nhật bạn bè:', e);
                    }
                }
            });
            this.friendSubscriptions.clear();

            // Hủy đăng ký từ cập nhật tin nhắn
            this.messageSubscriptions.forEach((sub) => {
                if (sub.subscription) {
                    try {
                        sub.subscription.unsubscribe();
                    } catch (e) {
                        console.error('Lỗi khi hủy đăng ký tin nhắn:', e);
                    }
                }
            });
            this.messageSubscriptions.clear();

            // Hủy đăng ký từ cập nhật thông báo
            this.notificationSubscriptions.forEach((sub) => {
                if (sub.subscription) {
                    try {
                        sub.subscription.unsubscribe();
                    } catch (e) {
                        console.error('Lỗi khi hủy đăng ký thông báo:', e);
                    }
                }
            });
            this.notificationSubscriptions.clear();

            this.resetConnection();
        }
    }
}

// Xuất một instance duy nhất của WebSocketService
export const webSocketService = new WebSocketService();
