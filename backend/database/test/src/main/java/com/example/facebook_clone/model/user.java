package com.example.facebook_clone.model;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "users")
public class user {

    @Id
     @Field("_id")
    private String id;
    private String username;
    private String email;
    private String password;
    private String firstName;
    private String lastName;
    private String avatar;
    private String role;
    private Date createdAt;

    // tạo constructor không tham số
    public user() {
    }
    // tạo constructor có tham số   
    public user(String id, String username, String email, String password, String firstName, String lastName, String avatar, String role, Date createdAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.avatar = avatar;
        this.role = role;
        this.createdAt = createdAt;
    }
    // tạo getter và setter cho các thuộc tính
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public String getFirstName() {
        return firstName;
    }
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    public String getLastName() {
        return lastName;
    }
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    public String getAvatar() {
        return avatar;
    }
    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
    }
    public Date getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
    @Override
    public String toString() {
        return "user [id=" + id + ", username=" + username + ", email=" + email + ", password=" + password
                + ", firstName=" + firstName + ", lastName=" + lastName + ", avatar=" + avatar + ", role=" + role
                + ", createdAt=" + createdAt + "]";
    }  
    // tạo hàm equals và hashCode
    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        user other = (user) obj;
        return id.equals(other.id) && username.equals(other.username) && email.equals(other.email)
                && password.equals(other.password) && firstName.equals(other.firstName)
                && lastName.equals(other.lastName) && avatar.equals(other.avatar) && role.equals(other.role)
                && createdAt.equals(other.createdAt);
    }
    @Override
    public int hashCode() {
        return id.hashCode() + username.hashCode() + email.hashCode() + password.hashCode() + firstName.hashCode()
                + lastName.hashCode() + avatar.hashCode() + role.hashCode() + createdAt.hashCode();
}

}