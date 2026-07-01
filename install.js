/**
 * ====================================================================
 * نص التثبيت الآلي وإعداد قاعدة البيانات لتطبيق "حصّالة الذهب والادخار"
 * لتشغيل هذا الملف: node install.js
 * ====================================================================
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[35m%s\x1b[0m', ' ✨ بدء عملية إعداد وتثبيت قاعدة بيانات تطبيق "حصّالة" ✨');
console.log('\x1b[36m%s\x1b[0m', '=======================================================');

async function runInstallation() {
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbPort = process.env.DB_PORT || 3306;

  if (!dbHost || !dbUser || !dbName) {
    console.log('\x1b[31m%s\x1b[0m', '⚠️  خطأ: بيانات الاتصال بقاعدة البيانات غير مكتملة في ملف .env');
    console.log('\x1b[33m%s\x1b[0m', 'يرجى التأكد من ملء المتغيرات التالية في ملف .env:');
    console.log('-------------------------------------------------------');
    console.log(`DB_HOST=${dbHost || 'لم يحدد بعد'}`);
    console.log(`DB_USER=${dbUser || 'لم يحدد بعد'}`);
    console.log(`DB_PASSWORD=${dbPassword ? '********' : 'فارغ'}`);
    console.log(`DB_NAME=${dbName || 'لم يحدد بعد'}`);
    console.log(`DB_PORT=${dbPort}`);
    console.log('-------------------------------------------------------');
    console.log('\x1b[32m%s\x1b[0m', '💡 تلميح: يمكنك إعداد قاعدة بيانات MySQL جديدة في استضافة Hostinger');
    console.log('\x1b[32m%s\x1b[0m', 'ثم نسخ التفاصيل وتعبئتها في ملف .env لتشغيل الإعداد تلقائياً.');
    process.exit(1);
  }

  console.log(`📡 جاري الاتصال بخادم قاعدة البيانات: ${dbHost}:${dbPort}...`);

  let connection;
  try {
    // Connect without db first to check and create database if it doesn't exist
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      port: Number(dbPort)
    });

    console.log('\x1b[32m%s\x1b[0m', '✅ تم الاتصال بخادم MySQL بنجاح!');
    
    console.log(`🛠️  جاري إنشاء قاعدة البيانات (إن لم تكن موجودة): ${dbName}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database: dbName });
    console.log('\x1b[32m%s\x1b[0m', `✅ قاعدة البيانات "${dbName}" جاهزة للعمل.`);

    // Read database.sql schema
    const schemaPath = path.join(process.cwd(), 'database.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('تعذر العثور على ملف المخطط database.sql في المجلد الرئيسي.');
    }

    console.log('📖 قراءة مخطط قاعدة البيانات من ملف database.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split queries by semicolon to execute them one by one
    // We filter out empty queries and keep SQL statements
    const queries = schemaSql
      .split(/;(?=(?:[^'"`]*['"`][^'"`]*['"`])*[^'"`]*$)/) // split by semicolon outside of strings
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`⚙️  جاري إنشاء الجداول وهيكلة الجداول المحددة (عدد العمليات: ${queries.length})...`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        await connection.query(query);
      } catch (err) {
        // Ignore duplicate inserts errors if already exist
        if (err.code !== 'ER_DUP_ENTRY') {
          console.warn(`⚠️  تحذير في الاستعلام #${i + 1}:`, err.message);
        }
      }
    }

    console.log('\x1b[32m%s\x1b[0m', '🎉 اكتمل بناء وتثبيت قاعدة بيانات "حصّالة" بالكامل وبنجاح!');
    console.log('-------------------------------------------------------');
    console.log('\x1b[35m%s\x1b[0m', '👤 بيانات حساب المسؤول الافتراضي جاهزة الآن:');
    console.log('📧 البريد الإلكتروني: \x1b[1madmin@hassala.com\x1b[0m');
    console.log('🔑 كلمة المرور: \x1b[1m123456\x1b[0m');
    console.log('-------------------------------------------------------');
    console.log('\x1b[36m%s\x1b[0m', '🚀 تطبيقك جاهز الآن للعمل بكفاءة تامة على الويب!');
    console.log('\x1b[36m%s\x1b[0m', '=======================================================');

  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', '❌ خطأ: فشل الاتصال بقاعدة البيانات أو تهيئتها.');
    console.log('\x1b[33m%s\x1b[0m', 'تفاصيل الخطأ:');
    console.error(error);
    console.log('-------------------------------------------------------');
    console.log('\x1b[32m%s\x1b[0m', 'نصيحة: تأكد من أن عنوان الخادم، اسم المستخدم، وكلمة المرور صحيحة،');
    console.log('\x1b[32m%s\x1b[0m', 'وأن جدار الحماية في خادمك يسمح بالاتصالات الخارجية إذا كنت تتصل عن بعد.');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runInstallation();
