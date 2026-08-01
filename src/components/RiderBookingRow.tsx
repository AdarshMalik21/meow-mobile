import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { RideRequest } from '../api';
import { routeLabel, formatSeatsLabel } from '../constants';
import { colors, fonts } from '../theme';

function riderSegmentDiffers(
  driverFrom: string,
  driverTo: string,
  riderFrom?: string,
  riderTo?: string
): boolean {
  if (!riderFrom || !riderTo) return false;
  return (
    riderFrom.toLowerCase() !== driverFrom.toLowerCase() ||
    riderTo.toLowerCase() !== driverTo.toLowerCase()
  );
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  BOOKED: 'Confirmed',
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: colors.primary,
  BOOKED: colors.success,
  REJECTED: colors.textMuted,
  CANCELLED: colors.textMuted,
};

type Props = {
  request: RideRequest;
  driverFrom: string;
  driverTo: string;
  busyId?: string | null;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

export function RiderBookingRow({
  request,
  driverFrom,
  driverTo,
  busyId,
  showActions = false,
  onApprove,
  onReject,
}: Props) {
  const status = request.status;
  const statusColor = STATUS_COLOR[status] ?? colors.textMuted;

  return (
    <View style={styles.row}>
      <Text style={styles.name}>{request.rider.name || 'Rider'}</Text>
      {request.rider.phone ? (
        <Pressable
          onPress={() => Linking.openURL(`tel:${request.rider.phone}`)}
          hitSlop={6}
        >
          <Text style={styles.phone}>
            Phone / फ़ोन: {request.rider.phone}
          </Text>
        </Pressable>
      ) : null}
      <Text style={styles.meta}>
        {formatSeatsLabel(request.seatsRequested ?? 1)}
      </Text>
      <Text style={[styles.status, { color: statusColor }]}>
        {STATUS_LABEL[status] || status}
      </Text>
      {request.riderFromCity && request.riderToCity ? (
        riderSegmentDiffers(
          driverFrom,
          driverTo,
          request.riderFromCity,
          request.riderToCity
        ) ? (
          <>
            <Text style={styles.routeCompare}>
              Your route: {routeLabel(driverFrom, driverTo)}
            </Text>
            <Text style={styles.routeCompareRider}>
              Rider trip: {routeLabel(request.riderFromCity, request.riderToCity)}
            </Text>
          </>
        ) : (
          <Text style={styles.route}>
            {routeLabel(request.riderFromCity, request.riderToCity)}
          </Text>
        )
      ) : null}
      {showActions && status === 'PENDING' && onApprove && onReject ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.btn, styles.allowBtn]}
            disabled={busyId === request.id}
            onPress={() => onApprove(request.id)}
          >
            <Text style={[styles.btnText, { color: colors.white }]}>Allow</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.dangerBtn]}
            disabled={busyId === request.id}
            onPress={() => onReject(request.id)}
          >
            <Text style={[styles.btnText, { color: colors.white }]}>Decline</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  phone: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  status: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 4,
  },
  route: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  routeCompare: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  routeCompareRider: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  btn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowBtn: { backgroundColor: colors.success, borderColor: colors.success },
  dangerBtn: { backgroundColor: colors.danger, borderColor: colors.danger },
  btnText: {
    fontFamily: fonts.bold,
    color: colors.text,
    fontSize: 13,
  },
});
