package com.example.facebook_clone.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String day;
    private String month;
    private String year;
    private String gender;
    private String bio;
    private String avatar;
    private String coverPhoto;
    private String role = "USER"; // Default role
    private String resetToken; // Token để đặt lại mật khẩu
    
    // Thêm getter và setter cho role
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    // Các getter và setter hiện có
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    
    public String getCoverPhoto() { return coverPhoto; }
    public void setCoverPhoto(String coverPhoto) { this.coverPhoto = coverPhoto; }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }  
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }
    
    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }
    
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getResetToken() {
        return resetToken;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }
}
