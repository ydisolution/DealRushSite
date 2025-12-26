import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), '..', 'Backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupName = `DealRush_${timestamp}`;

// יצירת תיקיית גיבויים
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 תיקיית Backups נוצרה');
}

console.log('🔄 מתחיל גיבוי...');
console.log(`📅 תאריך: ${new Date().toLocaleString('he-IL')}`);

try {
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  // בדיקה אם כבר יש גיבוי מהיום
  if (fs.existsSync(backupPath + '.zip')) {
    console.log('⚠️  כבר קיים גיבוי מהיום. מדלג...');
    process.exit(0);
  }
  
  console.log(`📂 יוצר תיקיית גיבוי: ${backupName}`);
  fs.mkdirSync(backupPath, { recursive: true });

  // העתקת קבצים חשובים
  const filesToCopy = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'drizzle.config.ts',
    'README.md',
    '.gitignore'
  ];

  const dirsToSyncSkipNodeModules = [
    'client',
    'server',
    'shared',
    'script',
    'migrations',
    'public'
  ];

  console.log('📋 מעתיק קבצי תצורה...');
  for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(backupPath, file));
      console.log(`   ✅ ${file}`);
    }
  }

  console.log('📁 מעתיק תיקיות...');
  for (const dir of dirsToSyncSkipNodeModules) {
    if (fs.existsSync(dir)) {
      const targetDir = path.join(backupPath, dir);
      fs.mkdirSync(targetDir, { recursive: true });
      
      try {
        if (process.platform === 'win32') {
          execSync(`xcopy "${dir}" "${targetDir}" /E /I /H /Y /Q`, { stdio: 'ignore' });
        } else {
          execSync(`cp -r "${dir}" "${targetDir}"`, { stdio: 'ignore' });
        }
        console.log(`   ✅ ${dir}/`);
      } catch (err) {
        console.log(`   ⚠️  ${dir}/ (חלקי)`);
      }
    }
  }

  // יצירת קובץ ZIP
  console.log('📦 יוצר קובץ ZIP...');
  try {
    if (process.platform === 'win32') {
      execSync(`powershell Compress-Archive -Path "${backupPath}\\*" -DestinationPath "${backupPath}.zip" -Force`, {
        stdio: 'inherit'
      });
    } else {
      execSync(`cd "${BACKUP_DIR}" && zip -r "${backupName}.zip" "${backupName}"`, {
        stdio: 'inherit'
      });
    }
    
    // מחיקת התיקייה (נשאר רק ה-ZIP)
    fs.rmSync(backupPath, { recursive: true, force: true });
    
    const stats = fs.statSync(backupPath + '.zip');
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ גיבוי הושלם בהצלחה!');
    console.log(`📍 מיקום: ${backupPath}.zip`);
    console.log(`📏 גודל: ${sizeInMB} MB`);
  } catch (zipError) {
    console.error('⚠️  שגיאה ביצירת ZIP, אבל הקבצים הועתקו:', zipError);
  }
  
  // שמירת 10 גיבויים אחרונים בלבד
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('DealRush_') && f.endsWith('.zip'))
    .sort()
    .reverse();
  
  if (backups.length > 10) {
    console.log('🗑️  מוחק גיבויים ישנים (שומר 10 אחרונים)...');
    backups.slice(10).forEach(old => {
      fs.unlinkSync(path.join(BACKUP_DIR, old));
      console.log(`   ❌ ${old}`);
    });
  }

  console.log(`\n💾 סה"כ גיבויים: ${Math.min(backups.length, 10)}`);

} catch (error) {
  console.error('❌ שגיאה בגיבוי:', error);
  process.exit(1);
}
