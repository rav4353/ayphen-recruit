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
    const { getStatusColor } = useStatusColors();

    // If statusInfo is provided from API, use it directly
    let customColor: { bg: string; text: string } | undefined;

    if (statusInfo) {
        customColor = {
            bg: statusInfo.bgColor,
            text: statusInfo.fontColor,
        };
    } else if (status && type) {
        // Fallback to context if statusInfo not provided
        customColor = getStatusColor(type, status);
    }

    const displayText = children || statusInfo?.name || status || '';

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
