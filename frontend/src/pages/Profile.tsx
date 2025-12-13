import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Link as LinkIcon,
  Star,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import styles from "./Profile.module.css";

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Recruiting");

  // Mock Widgets Data
  const todos = [
    { id: 1, text: "Review Pull Request #42", done: false },
    { id: 2, text: "Update documentation", done: true },
    { id: 3, text: "Meeting with design team", done: false },
  ];

  const followers = [
    { id: 1, name: "Alice Chen", role: "Designer", initials: "AC" },
    { id: 2, name: "Bob Smith", role: "DevOps", initials: "BS" },
    { id: 3, name: "Charlie Kim", role: "Frontend", initials: "CK" },
  ];

  // Mock Projects Data with Status
  const projects = [
    {
      id: 1,
      title: "EcoTrack",
      role: "Owner",
      desc: "A mobile app for tracking carbon footprint.",
      members: 3,
      likes: 45,
      status: "Recruiting",
    },
    {
      id: 2,
      title: "StudyBuddy AI",
      role: "Contributor",
      desc: "AI-powered study planner.",
      members: 5,
      likes: 120,
      status: "In Progress",
    },
    {
      id: 3,
      title: "Old Portfolio",
      role: "Owner",
      desc: "My previous portfolio site built with Gatsby.",
      members: 1,
      likes: 10,
      status: "Completed",
    },
  ];

  const filteredProjects = projects.filter((p) => p.status === activeTab);

  return (
    <div className={styles.container}>
      {/* Left Column: Main Content */}
      <div className={styles.leftColumn}>
        {/* User Header Card */}
        <div className={styles.profileHeader}>
          <div className={styles.banner}></div>
          <div className={styles.headerContent}>
            <div className={styles.headerTop}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>JD</div>
              </div>
              <div className={styles.actions}>
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </div>
            </div>

            <div className={styles.infoSection}>
              <div>
                <h1 className={styles.name}>John Doe</h1>
                <p className={styles.headline}>
                  Full Stack Developer | React & Python Enthusiast
                </p>
                <div className={styles.metaInfo}>
                  <span className={styles.location}>
                    <MapPin size={16} /> San Francisco, CA
                  </span>
                  <span className={styles.website}>
                    <LinkIcon size={16} /> johndoe.dev
                  </span>
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>12</span>
                  <span className={styles.statLabel}>Projects</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>85</span>
                  <span className={styles.statLabel}>Followers</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statVal}>42</span>
                  <span className={styles.statLabel}>Following</span>
                </div>
              </div>
            </div>

            <div className={styles.skillsSection}>
              <div className={styles.skills}>
                <span className={styles.skill}>React</span>
                <span className={styles.skill}>TypeScript</span>
                <span className={styles.skill}>Node.js</span>
                <span className={styles.skill}>UI/UX Design</span>
                <span className={styles.skill}>AWS Serverless</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Projects */}
        <div className={styles.contentSection}>
          <div className={styles.tabs}>
            {["Recruiting", "In Progress", "Completed", "Activities"].map(
              (tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${
                    activeTab === tab ? styles.activeTab : ""
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ),
            )}
          </div>

          <div className={styles.projectList}>
            {activeTab === "Activities" ? (
              <div className={styles.emptyState}>No recent activities.</div>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <Card key={project.id} className={styles.projectRow}>
                  <div className={styles.projectMain}>
                    <div className={styles.projectHeader}>
                      <h3>{project.title}</h3>
                      <span
                        className={`${styles.statusBadge} ${
                          styles[project.status.replace(" ", "")]
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <p>{project.desc}</p>
                    <div className={styles.tagsDisplay}>
                      <span className={styles.roleTag}>{project.role}</span>
                    </div>
                  </div>
                  <div className={styles.projectStats}>
                    <div className={styles.statPair}>
                      <UserPlus size={16} />
                      <span>{project.members} Members</span>
                    </div>
                    <div className={styles.statPair}>
                      <Star size={16} fill="#F59E0B" stroke="none" />
                      <span>{project.likes}</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className={styles.emptyState}>
                No projects in this category.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Widgets */}
      <aside className={styles.rightColumn}>
        {/* Todos Widget */}
        <Card className={styles.widgetCard}>
          <h3 className={styles.widgetTitle}>
            My Todos <span className={styles.count}>3</span>
          </h3>
          <div className={styles.todoList}>
            {todos.map((todo) => (
              <div key={todo.id} className={styles.todoItem}>
                <CheckCircle
                  size={18}
                  className={`${styles.checkIcon} ${
                    todo.done ? styles.done : ""
                  }`}
                />
                <span
                  className={`${styles.todoText} ${
                    todo.done ? styles.doneText : ""
                  }`}
                >
                  {todo.text}
                </span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className={styles.widgetBtn}>
            View All
          </Button>
        </Card>

        {/* New Followers Widget */}
        <Card className={styles.widgetCard}>
          <h3 className={styles.widgetTitle}>Recent Followers</h3>
          <div className={styles.followerList}>
            {followers.map((f) => (
              <div key={f.id} className={styles.followerItem}>
                <div className={styles.followerAvatar}>{f.initials}</div>
                <div className={styles.followerInfo}>
                  <span className={styles.followerName}>{f.name}</span>
                  <span className={styles.followerRole}>{f.role}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className={styles.followBtn}
                >
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Suggested Widget */}
        <div className={styles.promoWidget}>
          <h3>Upgrade to Pro</h3>
          <p>Unlock advanced analytics and unlimited projects.</p>
          <Button variant="default" className={styles.promoBtn}>
            Learn More
          </Button>
        </div>
      </aside>
    </div>
  );
};
