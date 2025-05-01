package com.example.facebook_clone.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service xử lý lưu trữ file
 */
@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    /**
     * Khởi tạo service và tạo thư mục lưu trữ
     */
    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads")
                .toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Không thể tạo thư mục để lưu trữ file tải lên.", ex);
        } catch (SecurityException ex) {
            throw new RuntimeException("Không có quyền tạo thư mục để lưu trữ file tải lên.", ex);
        }
    }

    /**
     * Lưu trữ file tải lên
     *
     * @param file File cần lưu trữ
     * @return Tên file đã lưu
     */
    public String storeFile(MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                originalFilename = "unknown_file";
            }
            String fileName = StringUtils.cleanPath(originalFilename);

            // Đảm bảo tên file an toàn và duy nhất
            // Thay thế khoảng trắng bằng gạch dưới và loại bỏ ký tự đặc biệt
            fileName = fileName.replaceAll("\\s+", "_").replaceAll("[^a-zA-Z0-9._-]", "");

            // Thêm timestamp để đảm bảo tính duy nhất
            long timestamp = System.currentTimeMillis();
            String newFileName = timestamp + "_" + fileName;

            Path targetLocation = this.fileStorageLocation.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu trữ file. Vui lòng thử lại!", ex);
        }
    }
}
