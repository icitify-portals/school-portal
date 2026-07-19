export const UTME_SUBJECT_TEMPLATES = {
  ENGINEERING: {
    compulsory: ["English Language", "Mathematics", "Physics", "Chemistry"],
    alternatives: []
  },
  MEDICINE: {
    compulsory: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology"],
    alternatives: []
  },
  LAW: {
    compulsory: ["English Language", "Literature in English"],
    alternatives: {
      "Government": ["Economics", "History", "Geography", "CRS/IRS"],
      "Mathematics": ["Economics", "Commerce", "Accounting"]
    }
  },
  COMPUTER_SCIENCE: {
    compulsory: ["English Language", "Mathematics", "Physics"],
    alternatives: {
      "Chemistry": ["Biology", "Economics", "Geography"]
    }
  },
  MASS_COMMUNICATION: {
    compulsory: ["English Language", "Literature in English"],
    alternatives: {
      "Government": ["Economics", "History", "Geography", "CRS/IRS", "Mathematics"]
    }
  }
};

export const OLEVEL_SUBJECT_TEMPLATES = {
  SCIENCE: {
    compulsory: ["English Language", "Mathematics", "Physics", "Chemistry"],
    optional: ["Biology", "Agricultural Science", "Geography"],
    minGrade: "C6",
    acceptsTwoSittings: true,
    sixthSubjectRequired: true
  },
  ARTS: {
    compulsory: ["English Language", "Literature in English"],
    optional: ["Government", "History", "Geography", "CRS/IRS", "Economics"],
    minGrade: "C6",
    acceptsTwoSittings: true,
    sixthSubjectRequired: true
  },
  SOCIAL_SCIENCE: {
    compulsory: ["English Language", "Mathematics"],
    optional: ["Economics", "Government", "Geography", "Accounting", "Commerce"],
    minGrade: "C6",
    acceptsTwoSittings: true,
    sixthSubjectRequired: true
  },
  MEDICINE: {
    compulsory: ["English Language", "Mathematics", "Physics", "Chemistry", "Biology"],
    optional: ["Agricultural Science", "Geography"],
    minGrade: "B3",
    acceptsTwoSittings: false,
    sixthSubjectRequired: false
  }
};
