export const DEFAULT_STATUS_COLORS = {
    job: {
        DRAFT: { bg: '#F3F4F6', text: '#374151' },
        OPEN: { bg: '#D1FAE5', text: '#065F46' },
        CLOSED: { bg: '#FEE2E2', text: '#991B1B' },
        ON_HOLD: { bg: '#FEF3C7', text: '#92400E' },
        PENDING_APPROVAL: { bg: '#DBEAFE', text: '#1E40AF' },
        APPROVED: { bg: '#E0E7FF', text: '#3730A3' },
        CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
    },
    application: {
        APPLIED: { bg: '#DBEAFE', text: '#1E40AF' },
        SCREENING: { bg: '#E0E7FF', text: '#3730A3' },
        PHONE_SCREEN: { bg: '#F3E8FF', text: '#6B21A8' },
        INTERVIEW: { bg: '#FAE8FF', text: '#86198F' },
        OFFER: { bg: '#D1FAE5', text: '#065F46' },
        HIRED: { bg: '#10B981', text: '#FFFFFF' },
        REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
        WITHDRAWN: { bg: '#F3F4F6', text: '#374151' },
    },
};
