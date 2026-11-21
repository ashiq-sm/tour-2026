/**
 * Prayer Times (আজান ও নামাজের ওয়াক্ত) & Tayammum Rules Data
 * Pre-calibrated high-precision baseline for Sylhet -> Chattogram -> Lama/Mirinja -> Cox's -> St. Martin.
 * Also supports dynamic live refresh via Aladhan API and device GPS Geolocation when online.
 */

export const PRAYER_LOCATIONS = [
  {
    id: 'sylhet',
    name: 'সিলেট (SUST ক্যাম্পাস / শুরু)',
    lat: 24.8949,
    lon: 91.8687,
    district: 'Sylhet',
    division: 'Sylhet',
    baseTimes: {
      fajr: '04:53',
      sunrise: '06:13',
      dhuhr: '11:38',
      asr: '14:43',
      maghrib: '17:04',
      isha: '18:23'
    }
  },
  {
    id: 'chattogram',
    name: 'চট্টগ্রাম (রেল স্টেশন / ট্রানজিট)',
    lat: 22.3569,
    lon: 91.7832,
    district: 'Chattogram',
    division: 'Chattogram',
    baseTimes: {
      fajr: '04:51',
      sunrise: '06:09',
      dhuhr: '11:39',
      asr: '14:47',
      maghrib: '17:08',
      isha: '18:26'
    }
  },
  {
    id: 'mirinja',
    name: 'মিরিঞ্জা ভ্যালি (লামা, বান্দরবান)',
    lat: 21.7833,
    lon: 92.2000,
    district: 'Bandarban',
    division: 'Chattogram',
    baseTimes: {
      fajr: '04:49',
      sunrise: '06:06',
      dhuhr: '11:37',
      asr: '14:46',
      maghrib: '17:08',
      isha: '18:25'
    }
  },
  {
    id: 'coxsbazar',
    name: "কক্সবাজার সমুদ্র সৈকত",
    lat: 21.4272,
    lon: 92.0058,
    district: "Cox's Bazar",
    division: 'Chattogram',
    baseTimes: {
      fajr: '04:49',
      sunrise: '06:06',
      dhuhr: '11:38',
      asr: '14:47',
      maghrib: '17:09',
      isha: '18:26'
    }
  },
  {
    id: 'stmartin',
    name: 'সেন্টমার্টিন দ্বীপ (জাহাজ ও উপকূল)',
    lat: 20.6273,
    lon: 92.3225,
    district: "Cox's Bazar",
    division: 'Chattogram',
    baseTimes: {
      fajr: '04:47',
      sunrise: '06:04',
      dhuhr: '11:36',
      asr: '14:47',
      maghrib: '17:09',
      isha: '18:26'
    }
  }
];

export const TAYAMMUM_GUIDELINES = [
  {
    condition: 'বাস বা ট্রেন চলন্ত অবস্থায় ও পানির অপ্রতুলতা',
    rule: 'চলন্ত যানবাহনে পানি না থাকলে বা অল্প পানি কেবল পানের জন্য সংরক্ষিত থাকলে, বা অযু করার মতো পানি বা স্থান না পাওয়া গেলে সিট, বাসের দেওয়াল বা পরিষ্কার ধুলাযুক্ত স্থানে হাত মেরে তায়াম্মুম করা জায়েয।'
  },
  {
    condition: 'পাহাড় / মিরিঞ্জা ভ্যালিতে কনকনে শীত ও অসুস্থতার ভয়',
    rule: 'ভোরে বা রাতে প্রচণ্ড ঠাণ্ডায় ঠাণ্ডা পানি ব্যবহারে মারাত্মক অসুস্থ হয়ে পড়ার প্রবল আশঙ্কা থাকলে এবং গরম পানির ব্যবস্থা না থাকলে পবিত্র মাটি বা পাথরে হাত মেরে তায়াম্মুম করা যায়।'
  },
  {
    condition: 'সেন্টমার্টিন জাহাজ বা দ্বীপে পানি সংকট',
    rule: 'জাহাজে বা সৈকতে নিরাপদ মিষ্টি পানি না থাকলে কিংবা এক মাইলের মধ্যে পানির সন্ধান না পাওয়া গেলে শুষ্ক পবিত্র মাটি/বালুকা পাথরে তায়াম্মুম করতে হবে। সমুদ্রের নোনা পানিতে অযু জায়েয হলেও যদি চর্মরোগ বা ক্ষতি হয় তবে তায়াম্মুম বৈধ।'
  },
  {
    step: 'পদ্ধতি (সুন্নত নিয়ম)',
    rule: '১. নিয়ত করা। ২. বিসমিল্লাহ বলে দুই হাত পবিত্র মাটি/পাথরে মেরে অতিরিক্ত ধুলা ঝেড়ে সম্পূর্ণ মুখমণ্ডল মাসেহ করা। ৩. পুনরায় মাটিতে হাত মেরে কনুইসহ উভয় হাত মাসেহ করা।'
  }
];
