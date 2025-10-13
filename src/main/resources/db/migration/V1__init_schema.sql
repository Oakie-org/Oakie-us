-- DadaIsland initial schema for MVP

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(512),
    city VARCHAR(100),
    school VARCHAR(150),
    bio TEXT,
    roles JSON NOT NULL DEFAULT (JSON_ARRAY()),
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_users_user_id UNIQUE (user_id),
    CONSTRAINT uk_users_phone UNIQUE (phone_number),
    CONSTRAINT uk_users_email UNIQUE (email),
    INDEX idx_users_city_school (city, school),
    INDEX idx_users_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    slug VARCHAR(120) NOT NULL,
    title VARCHAR(150) NOT NULL,
    summary VARCHAR(512),
    description LONGTEXT,
    visibility ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    city VARCHAR(100),
    school VARCHAR(150),
    status ENUM('PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'PLANNING',
    progress_state VARCHAR(80),
    start_at DATETIME(6),
    end_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_projects_slug UNIQUE (slug),
    CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_projects_owner (owner_id),
    INDEX idx_projects_status_location (status, city, school)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE project_members (
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('OWNER', 'MAINTAINER', 'CONTRIBUTOR', 'MENTOR') NOT NULL DEFAULT 'CONTRIBUTOR',
    membership_status ENUM('PENDING', 'ACCEPTED', 'LEFT', 'KICKED') NOT NULL DEFAULT 'PENDING',
    joined_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    left_at DATETIME(6),
    notes TEXT,
    PRIMARY KEY (project_id, user_id),
    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_project_members_user_status (user_id, membership_status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE contributions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    contributor_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    artifact_url VARCHAR(512),
    artifact_type ENUM('DOC', 'CODE', 'DESIGN', 'DEMO', 'OTHER') NOT NULL DEFAULT 'OTHER',
    summary TEXT,
    status ENUM('SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    submitted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_contributions_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_contributions_contributor FOREIGN KEY (contributor_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_contributions_project_status (project_id, status),
    INDEX idx_contributions_contributor_status (contributor_id, status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE contribution_approvals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    contribution_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    decision ENUM('APPROVED', 'REJECTED') NOT NULL,
    comment TEXT,
    decided_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_contribution_approval UNIQUE (contribution_id, reviewer_id),
    CONSTRAINT fk_contribution_approvals_contribution FOREIGN KEY (contribution_id) REFERENCES contributions (id) ON DELETE CASCADE,
    CONSTRAINT fk_contribution_approvals_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_contribution_approvals_reviewer (reviewer_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE auth_refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    issued_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    revoked_at DATETIME(6),
    metadata JSON NOT NULL DEFAULT (JSON_OBJECT()),
    CONSTRAINT uk_auth_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_auth_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_auth_refresh_tokens_user_active (user_id, revoked_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(120) NOT NULL,
    label VARCHAR(120) NOT NULL,
    type ENUM('SKILL', 'DOMAIN', 'TOOL', 'OTHER') NOT NULL DEFAULT 'OTHER',
    description TEXT,
    usage_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT uk_tags_slug UNIQUE (slug)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE project_tags (
    project_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    added_by BIGINT,
    added_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (project_id, tag_id),
    CONSTRAINT fk_project_tags_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_tags_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_tags_added_by FOREIGN KEY (added_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_project_tags_tag (tag_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE user_skills (
    user_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    level TINYINT UNSIGNED,
    endorsed_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, tag_id),
    CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_skills_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE project_skill_requirements (
    project_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    level_required TINYINT UNSIGNED,
    notes TEXT,
    PRIMARY KEY (project_id, tag_id),
    CONSTRAINT fk_project_skill_requirements_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_skill_requirements_tag FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    aggregate_type VARCHAR(120) NOT NULL,
    aggregate_id VARCHAR(120) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    payload JSON NOT NULL,
    status ENUM('PENDING', 'PUBLISHED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    available_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    published_at DATETIME(6),
    retry_count INT NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_events_status_available (status, available_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT,
    template_code VARCHAR(120) NOT NULL,
    channel ENUM('INBOX', 'EMAIL') NOT NULL DEFAULT 'INBOX',
    status ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    payload JSON,
    sent_at DATETIME(6),
    read_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE SET NULL,
    INDEX idx_notifications_user_read (user_id, read_at),
    INDEX idx_notifications_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
