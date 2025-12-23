import { Badge } from './Badge';
import { useStatusColors } from '../../contexts/StatusColorContext';

interface StatusInfo {
    name: string;
    code: string;
    fontColor: string;
    bgColor: string;
    borderColor: string;
}

interface StatusBadgeProps {
    status?: string;
    type?: 'job' | 'application';
    statusInfo?: StatusInfo;
    className?: string;
    children?: React.ReactNode;
}

export function StatusBadge({ status, type, statusInfo, className, children }: StatusBadgeProps) {
    const { getStatusColor, getStatusLabel } = useStatusColors();

    // If statusInfo is provided from API, use it directly
    let customColor: { bg: string; text: string } | undefined;
    let displayLabel: string | undefined;

    if (statusInfo) {
        customColor = {
            bg: statusInfo.bgColor,
            text: statusInfo.fontColor,
        };
        displayLabel = statusInfo.name;
    } else if (status && type) {
        // Fallback to context if statusInfo not provided
        const statusConfig = getStatusColor(type, status);
        customColor = statusConfig ? { bg: statusConfig.bg, text: statusConfig.text } : undefined;
        displayLabel = getStatusLabel(type, status);
    }

    const displayText = children || displayLabel || status || '';

    return (
        <Badge
            variant="secondary"
            customColor={customColor}
            className={className}
        >
            {displayText}
        </Badge>
    );
}
