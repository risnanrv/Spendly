// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_nice_annihilus.sql';
import m0001 from './0001_change_description_to_title_note.sql';
import m0002 from './0002_add_is_system_to_categories.sql';
import m0003 from './0003_extend_sync_queue.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003
    }
  }
  