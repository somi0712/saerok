import { useEffect, useState } from 'react';
import { Card } from '@/design/ui';
import './announcements.css';
import { database, listAnnouncements, type Announcement } from '@/data/announcements';

export function AnnouncementFeed() {
  const [notices, setNotices] = useState<Announcement[]>([]);
  useEffect(() => {
    if (!database) return;
    let active = true;
    listAnnouncements(database, true).then((rows) => {
      if (active) setNotices(rows);
    }).catch(() => {
      // Backend downtime should leave the locally available practice flow usable.
    });
    return () => { active = false; };
  }, []);

  if (notices.length === 0) return null;
  return (
    <Card>
      <h2 className="ann-h">공지사항</h2>
      {notices.map(({ id, title, body }) => (
        <details key={id} className="ann-item">
          <summary>{title}</summary>
          <p className="sub">{body}</p>
        </details>
      ))}
    </Card>
  );
}
