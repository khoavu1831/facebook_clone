-- Tạo bảng ThongTinNguoiDung
CREATE TABLE ThongTinNguoiDung (
    IdNguoiDung INT PRIMARY KEY AUTO_INCREMENT,
    TaiKhoan VARCHAR(50) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    Anh VARCHAR(255),
    Ho VARCHAR(50),
    Ten VARCHAR(50),
    TrangThai VARCHAR(20),
    VaiTro ENUM('user', 'admin') DEFAULT 'user',
    NgayTao DATETIME DEFAULT NOW()
);

-- Tạo bảng BanBe
CREATE TABLE BanBe (
    IdNguoiDung INT,
    IdBanBe INT,
    TrangThai ENUM('pending', 'accepted') DEFAULT 'pending',
    NgayTao DATETIME DEFAULT NOW(),
    PRIMARY KEY (IdNguoiDung, IdBanBe),
    FOREIGN KEY (IdNguoiDung) REFERENCES ThongTinNguoiDung(IdNguoiDung),
    FOREIGN KEY (IdBanBe) REFERENCES ThongTinNguoiDung(IdNguoiDung)
);

-- Tạo bảng BaiViet (không có cột IdNguoiDung)
CREATE TABLE BaiViet (
    IdBaiViet INT PRIMARY KEY AUTO_INCREMENT,
    NoiDung TEXT,
    TrangThai VARCHAR(20),
    NgayTao DATETIME DEFAULT NOW()
);

-- Tạo bảng BaiViet_Anh
CREATE TABLE BaiViet_Anh (
    IdAnh INT PRIMARY KEY AUTO_INCREMENT,
    IdBaiViet INT,
    DuongDan VARCHAR(255) NOT NULL,
    TrangThai VARCHAR(20),
    FOREIGN KEY (IdBaiViet) REFERENCES BaiViet(IdBaiViet)
);

-- Tạo bảng BaiViet_Video
CREATE TABLE BaiViet_Video (
    IdVideo INT PRIMARY KEY AUTO_INCREMENT,
    IdBaiViet INT,
    DuongDan VARCHAR(255) NOT NULL,
    TrangThai VARCHAR(20),
    FOREIGN KEY (IdBaiViet) REFERENCES BaiViet(IdBaiViet)
);

-- Tạo bảng TuongTac (khóa chính và khóa ngoại là cặp IdNguoiDung và IdBaiViet)
CREATE TABLE TuongTac (
    IdNguoiDung INT,
    IdBaiViet INT,
    LoaiTuongTac ENUM('like', 'comment', 'share') NOT NULL,
    NoiDung TEXT,
    NgayTao DATETIME DEFAULT NOW(),
    PRIMARY KEY (IdNguoiDung, IdBaiViet),
    FOREIGN KEY (IdNguoiDung) REFERENCES ThongTinNguoiDung(IdNguoiDung),
    FOREIGN KEY (IdBaiViet) REFERENCES BaiViet(IdBaiViet)
);