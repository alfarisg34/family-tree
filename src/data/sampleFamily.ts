import type { FamilyData } from '../types/family';

export const initialFamilyData: FamilyData = {
  familyTreeName: "Bani Sastrowardoyo & Siti Aminah",
  description: "Silsilah Keluarga Besar Trah Sastrowardoyo (Yogyakarta - Jakarta - Bandung - Surabaya)",
  updatedAt: new Date().toISOString(),
  members: {
    // ==========================================
    // GENERASI 1: BUYUT / LELUHUR (GEN 1)
    // ==========================================
    "gen1-1": {
      id: "gen1-1",
      fullName: "Raden Mas Sastrowardoyo",
      nickname: "Eyang Buyut Kakung",
      title: "R.M.",
      gender: "male",
      generation: 1,
      birthDate: "1912-05-10",
      birthPlace: "Kotagede, Yogyakarta",
      isDeceased: true,
      passedDate: "1988-11-20",
      passedPlace: "Yogyakarta",
      burialPlace: "Makam Keluarga Kotagede, D.I. Yogyakarta",
      education: "Hollandsch-Inlandsche School (HIS) Yogyakarta",
      occupation: "Pegawai Pamong Praja & Pengrajin Batik",
      workplace: "Kasultanan Ngayogyakarta Hadiningrat",
      residence: "Jl. Mondorakan, Kotagede, Yogyakarta",
      bio: "Pendiri trah keluarga besar Sastrowardoyo. Tokoh panutan yang gemar membatik dan melestarikan gamelan Jawa. Dikenal dengan ketegasan dan kebijaksanaannya dalam mendidik anak cucu.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g1-1",
          url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop",
          caption: "Potret resmi Raden Mas Sastrowardoyo (Tahun 1970)",
          date: "1970"
        },
        {
          id: "g1-2",
          url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80&auto=format&fit=crop",
          caption: "Momen perkumpulan keluarga di Pendopo Kotagede",
          date: "1982"
        }
      ],
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen1-2",
          status: "married",
          marriageDate: "1935-08-12",
          note: "Menikah di Pendopo Ndalem Kotagede"
        }
      ],
      order: 1
    },

    "gen1-2": {
      id: "gen1-2",
      fullName: "Raden Ayu Siti Aminah",
      nickname: "Eyang Buyut Putri",
      title: "R.Ay.",
      gender: "female",
      generation: 1,
      birthDate: "1918-09-24",
      birthPlace: "Bantul, D.I. Yogyakarta",
      isDeceased: true,
      passedDate: "1995-04-14",
      passedPlace: "Yogyakarta",
      burialPlace: "Makam Keluarga Kotagede, D.I. Yogyakarta",
      education: "Sekolah Kepandaian Putri Yogyakarta",
      occupation: "Wirausaha Batik Tulis Tradisional",
      workplace: "Batik Tulis Aminah Kotagede",
      residence: "Jl. Mondorakan, Kotagede, Yogyakarta",
      bio: "Ibu teladan yang penuh kasih sayang, mahir dalam resep masakan gudeg manggar dan batik sutra halus warisan keraton.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g1-3",
          url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80&auto=format&fit=crop",
          caption: "Eyang Buyut Putri Siti Aminah mengenakan kebaya klasik",
          date: "1975"
        }
      ],
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen1-1",
          status: "married",
          marriageDate: "1935-08-12"
        }
      ],
      order: 1
    },

    // ==========================================
    // GENERASI 2: KAKEK / NENEK (GEN 2)
    // ==========================================
    "gen2-1": {
      id: "gen2-1",
      fullName: "Prof. Dr. Ir. Hendra Sastrowardoyo, M.Sc.",
      nickname: "Eyang Hendra",
      title: "Prof. Dr. Ir.",
      gender: "male",
      generation: 2,
      birthDate: "1938-03-15",
      birthPlace: "Yogyakarta",
      isDeceased: true,
      passedDate: "2018-06-10",
      passedPlace: "Jakarta Selatan",
      burialPlace: "TPU Tanah Kusir, Jakarta Selatan",
      education: "Doktor Teknik Sipil - TU Delft, Belanda",
      occupation: "Guru Besar & Konsultan Infrastruktur Nasional",
      workplace: "Institut Teknologi Bandung & Kementerian PUPR",
      residence: "Kebayoran Baru, Jakarta Selatan",
      bio: "Putra sulung keluarga. Berjasa besar dalam proyek jembatan dan bendungan nasional. Sangat menyukai catur dan musik gamelan klasik.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g2-1",
          url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&auto=format&fit=crop",
          caption: "Prof. Hendra saat pengukuhan Guru Besar ITB",
          date: "1992"
        },
        {
          id: "g2-2",
          url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80&auto=format&fit=crop",
          caption: "Eyang Hendra bersama cucu pertama",
          date: "2005"
        }
      ],
      parentIds: ["gen1-1", "gen1-2"],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen2-2",
          status: "married",
          marriageDate: "1964-06-20",
          note: "Menikah di Bandung"
        }
      ],
      order: 1
    },

    "gen2-2": {
      id: "gen2-2",
      fullName: "Dra. Hj. Nurul Farida, M.Pd.",
      nickname: "Eyang Farida",
      title: "Dra. Hj.",
      gender: "female",
      generation: 2,
      birthDate: "1942-10-05",
      birthPlace: "Bandung, Jawa Barat",
      isDeceased: false,
      education: "S2 Magister Pendidikan Bahasa - Universitas Pendidikan Indonesia (UPI)",
      occupation: "Pensiunan Kepala Sekolah SMA Negeri",
      workplace: "Dinas Pendidikan DKI Jakarta",
      residence: "Kebayoran Baru, Jakarta Selatan",
      phone: "+62 811-987-654",
      bio: "Nenek yang periang dan aktif di majelis taklim serta perkumpulan pensiunan pendidik. Masih gemar merajut dan merawat anggrek.",
      avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g2-3",
          url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&q=80&auto=format&fit=crop",
          caption: "Eyang Farida di taman anggrek rumah Kebayoran",
          date: "2023"
        }
      ],
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen2-1",
          status: "married",
          marriageDate: "1964-06-20"
        }
      ],
      order: 1
    },

    "gen2-3": {
      id: "gen2-3",
      fullName: "Drs. Bambang Trihatmojo Sastrowardoyo",
      nickname: "Pakde Bambang",
      title: "Drs.",
      gender: "male",
      generation: 2,
      birthDate: "1945-02-18",
      birthPlace: "Yogyakarta",
      isDeceased: false,
      education: "S1 Hubungan Internasional - Universitas Gadjah Mada (UGM)",
      occupation: "Mantan Diplomat & Pengamat Kebijakan Publik",
      workplace: "Kementerian Luar Negeri RI (Purna Tugas)",
      residence: "Menteng, Jakarta Pusat",
      phone: "+62 812-456-789",
      bio: "Anak kedua dari Eyang Sastrowardoyo. Pernah bertugas di KBRI Tokyo dan Jenewa. Gemar mengoleksi buku sejarah dan cangkir keramik.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g2-4",
          url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80&auto=format&fit=crop",
          caption: "Drs. Bambang saat kunjungan diplomatik",
          date: "1998"
        }
      ],
      parentIds: ["gen1-1", "gen1-2"],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen2-4",
          status: "divorced",
          marriageDate: "1972-04-10",
          divorceDate: "1990-08-15",
          note: "Berpisah secara baik-baik tahun 1990"
        },
        {
          spouseId: "gen2-5",
          status: "married",
          marriageDate: "1994-11-12",
          note: "Pernikahan kedua di Menteng"
        }
      ],
      order: 2
    },

    "gen2-4": {
      id: "gen2-4",
      fullName: "Ratna Kusumaningsih, S.H.",
      nickname: "Ibu Ratna (Mantan Istri)",
      title: "S.H.",
      gender: "female",
      generation: 2,
      birthDate: "1948-07-30",
      birthPlace: "Solo, Jawa Tengah",
      isDeceased: false,
      education: "Fakultas Hukum Universitas Diponegoro",
      occupation: "Notaris & PPAT Senior",
      workplace: "Kantor Notaris Ratna Kusumaningsih",
      residence: "Kecamatan Candisari, Semarang",
      bio: "Mantan istri Drs. Bambang Trihatmojo (bercerai 1990). Tetap menjaga silaturahmi baik demi anak-anak mereka.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop&facepad=2",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen2-3",
          status: "divorced",
          marriageDate: "1972-04-10",
          divorceDate: "1990-08-15"
        }
      ],
      order: 1
    },

    "gen2-5": {
      id: "gen2-5",
      fullName: "Sri Wahyuni, B.A.",
      nickname: "Tante Yuni",
      title: "B.A.",
      gender: "female",
      generation: 2,
      birthDate: "1955-08-14",
      birthPlace: "Surabaya",
      isDeceased: false,
      education: "Literature & Arts - Melbourne University",
      occupation: "Kurator Galeri Seni",
      workplace: "Menteng Heritage Arts",
      residence: "Menteng, Jakarta Pusat",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&auto=format&fit=crop&facepad=2",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen2-3",
          status: "married",
          marriageDate: "1994-11-12"
        }
      ],
      order: 2
    },

    // ==========================================
    // GENERASI 3: ORANG TUA / PAMAN / BIBI (GEN 3)
    // ==========================================
    "gen3-1": {
      id: "gen3-1",
      fullName: "Aryo Danang Sastrowardoyo, S.T., M.B.A.",
      nickname: "Mas Aryo",
      title: "S.T., M.B.A.",
      gender: "male",
      generation: 3,
      birthDate: "1968-12-14",
      birthPlace: "Bandung, Jawa Barat",
      isDeceased: false,
      education: "S1 Teknik Elektro ITB, MBA NUS Singapore",
      occupation: "Managing Director di Perusahaan Teknologi",
      workplace: "Nusantara Digital Solusindo",
      residence: "BSD City, Tangerang Selatan",
      phone: "+62 813-1122-3344",
      email: "aryo.sastro@example.com",
      bio: "Anak pertama dari Prof. Hendra. Senang bersepeda di akhir pekan dan mengoleksi piringan hitam klasik.",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g3-1",
          url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80&auto=format&fit=crop",
          caption: "Aryo saat peresmian kantor baru di BSD",
          date: "2021"
        }
      ],
      parentIds: ["gen2-1", "gen2-2"],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen3-2",
          status: "married",
          marriageDate: "1996-09-08"
        }
      ],
      order: 1
    },

    "gen3-2": {
      id: "gen3-2",
      fullName: "dr. Maya Kartika Dewi, Sp.A(K)",
      nickname: "Dokter Maya",
      title: "dr., Sp.A(K)",
      gender: "female",
      generation: 3,
      birthDate: "1972-04-22",
      birthPlace: "Surabaya",
      isDeceased: false,
      education: "Spesialis Anak Konsultan Perinatologi - FK UI",
      occupation: "Dokter Spesialis Anak",
      workplace: "RS Pondok Indah & RSUP Fatmawati",
      residence: "BSD City, Tangerang Selatan",
      phone: "+62 811-3344-5566",
      email: "dr.maya.kartika@example.com",
      bio: "Dokter spesialis anak yang berdedikasi tinggi. Sangat mencintai kuliner nusantara dan berkebun hidroponik.",
      avatar: "https://images.unsplash.com/photo-1594824813501-483584852936?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g3-2",
          url: "https://images.unsplash.com/photo-1594824813501-483584852936?w=800&q=80&auto=format&fit=crop",
          caption: "dr. Maya di simposium pediatri internasional",
          date: "2022"
        }
      ],
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen3-1",
          status: "married",
          marriageDate: "1996-09-08"
        }
      ],
      order: 1
    },

    "gen3-3": {
      id: "gen3-3",
      fullName: "Dimas Aditya Sastrowardoyo, S.Ds.",
      nickname: "Om Dimas",
      title: "S.Ds.",
      gender: "male",
      generation: 3,
      birthDate: "1975-06-11",
      birthPlace: "Semarang",
      isDeceased: false,
      education: "Desain Komunikasi Visual - Institut Seni Indonesia (ISI) Yogyakarta",
      occupation: "Creative Director & Fotografer",
      workplace: "Studio Cahaya Visual Studio",
      residence: "Dago Atas, Bandung",
      phone: "+62 818-7788-9900",
      bio: "Putra dari pernikahan Drs. Bambang dan Ratna Kusumaningsih. Fotografer lanskap yang karya-karyanya sering dipamerkan di galeri seni Asia Tenggara.",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&auto=format&fit=crop&facepad=2",
      parentIds: ["gen2-3", "gen2-4"],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen3-4",
          status: "married",
          marriageDate: "2004-05-15"
        }
      ],
      order: 1
    },

    "gen3-4": {
      id: "gen3-4",
      fullName: "Anindya Putri Utami, S.Sn.",
      nickname: "Tante Nindy",
      title: "S.Sn.",
      gender: "female",
      generation: 3,
      birthDate: "1980-01-19",
      birthPlace: "Bandung",
      isDeceased: false,
      education: "Seni Rupa ITB",
      occupation: "Ilustrator & Desainer Tekstil",
      workplace: "Nindy Pattern Atelier",
      residence: "Dago Atas, Bandung",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop&facepad=2",
      parentIds: [],
      relationshipToParents: "biological",
      spouses: [
        {
          spouseId: "gen3-3",
          status: "married",
          marriageDate: "2004-05-15"
        }
      ],
      order: 1
    },

    // ==========================================
    // GENERASI 4: ANAK & MENANTU (GEN 4)
    // ==========================================
    "gen4-1": {
      id: "gen4-1",
      fullName: "Bima Satria Sastrowardoyo, S.Kom.",
      nickname: "Bima",
      title: "S.Kom.",
      gender: "male",
      generation: 4,
      birthDate: "1998-03-20",
      birthPlace: "Jakarta",
      isDeceased: false,
      education: "S1 Ilmu Komputer Universitas Indonesia (UI)",
      occupation: "Senior Software Engineer",
      workplace: "Unicorn Tech Company Indonesia",
      residence: "Kuningan, Jakarta Selatan",
      phone: "+62 812-9988-7766",
      email: "bima.satria@example.com",
      bio: "Anak kandung pertama dari Aryo & Maya. Senang berkontribusi di open source dan olahraga lari maraton.",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g4-1",
          url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80&auto=format&fit=crop",
          caption: "Bima saat finish Jakarta Half Marathon",
          date: "2023"
        }
      ],
      parentIds: ["gen3-1", "gen3-2"],
      relationshipToParents: "biological",
      spouses: [],
      order: 1
    },

    "gen4-2": {
      id: "gen4-2",
      fullName: "Nadia Larasati Sastrowardoyo, B.Sc.",
      nickname: "Nadia (Anak Angkat)",
      title: "B.Sc.",
      gender: "female",
      generation: 4,
      birthDate: "2001-09-15",
      birthPlace: "Yogyakarta",
      isDeceased: false,
      education: "B.Sc. in Environmental Science - Monash University",
      occupation: "Sustainability Consultant",
      workplace: "EcoNusantara Advisory",
      residence: "BSD City, Tangerang Selatan",
      phone: "+62 813-7766-5544",
      email: "nadia.larasati@example.com",
      bio: "Diangkat sebagai anak dengan penuh kasih sayang oleh keluarga Aryo & Maya pada tahun 2002. Sangat peduli pada isu kelestarian lingkungan dan terumbu karang.",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80&auto=format&fit=crop&facepad=2",
      gallery: [
        {
          id: "g4-2",
          url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80&auto=format&fit=crop",
          caption: "Nadia saat wisuda sarjana di Melbourne",
          date: "2023"
        },
        {
          id: "g4-3",
          url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80&auto=format&fit=crop",
          caption: "Proyek konservasi laut di Labuan Bajo",
          date: "2024"
        }
      ],
      parentIds: ["gen3-1", "gen3-2"],
      relationshipToParents: "adopted",
      spouses: [],
      order: 2
    },

    "gen4-3": {
      id: "gen4-3",
      fullName: "Kezia Kirana Sastrowardoyo",
      nickname: "Kezia",
      gender: "female",
      generation: 4,
      birthDate: "2007-11-04",
      birthPlace: "Bandung",
      isDeceased: false,
      education: "SMA Negeri 3 Bandung (Kelas XII)",
      occupation: "Pelajar & Atlet Bulutangkis Junior",
      residence: "Dago Atas, Bandung",
      bio: "Putri bungsu dari Dimas & Anindya. Juara turnamen bulutangkis antar-pelajar se-Jawa Barat. Hobi melukis watercolor.",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80&auto=format&fit=crop&facepad=2",
      parentIds: ["gen3-3", "gen3-4"],
      relationshipToParents: "biological",
      spouses: [],
      order: 1
    }
  }
};
