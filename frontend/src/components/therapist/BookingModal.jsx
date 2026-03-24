"use client";

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { sessionService } from '@/services/sessionService';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';
import toast from 'react-hot-toast';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function BookingModal({ open, onClose, therapist, onBook }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [unavailableDay, setUnavailableDay] = useState(false);
  const [therapistAvailDays, setTherapistAvailDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const therapistName = therapist?.fullName || therapist?.user?.fullName || 'therapist';
  const therapistUserId = String(therapist?.user?._id || therapist?.userId || therapist?._id || '');

  // Generate time slots within the therapist's working hours
  const generateTimeSlots = useCallback((startHour = 9, endHour = 17) => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push({
        hour,
        time: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        displayTime: `${String(hour).padStart(2, '0')}:00`,
      });
    }
    return slots;
  }, []);

  const fetchAvailableSlots = useCallback(async (dateValue) => {
    if (!dateValue || !therapistUserId) {
      return;
    }

    setFetchingSlots(true);
    setUnavailableDay(false);
    try {
      const response = await sessionService.getAvailableSlots(therapistUserId, dateValue);
      const data = response.data || {};
      const bookedHours = data.bookedHours || [];
      const pendingHours = data.pendingHours || [];
      const availableHours = Array.isArray(data.availableHours) ? data.availableHours : [];
      const allowedHours = Array.isArray(data.allowedHours) ? data.allowedHours : [];
      const startHour = data.startHour ?? 9;
      const endHour = data.endHour ?? 17;

      if (data.availableDays) {
        setTherapistAvailDays(data.availableDays);
      }

      if (data.isAvailableDay === false) {
        setUnavailableDay(true);
        setAvailableSlots([]);
        return;
      }

      const baseHours = allowedHours.length > 0
        ? allowedHours
        : Array.from(
            new Set([
              ...availableHours,
              ...pendingHours,
              ...bookedHours,
              ...generateTimeSlots(startHour, endHour).map((slot) => slot.hour),
            ])
          ).sort((a, b) => a - b);

      const generatedSlots = baseHours.map((hour) => {
        let status = 'available';
        if (bookedHours.includes(hour)) {
          status = 'confirmed';
        } else if (pendingHours.includes(hour)) {
          status = 'pending';
        }

        return {
          hour,
          time: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
          displayTime: `${String(hour).padStart(2, '0')}:00`,
          status,
          isBooked: status !== 'available',
        };
      });

      setAvailableSlots(generatedSlots);
    } catch (error) {
      console.error('Failed to fetch available slots:', error);
      setAvailableSlots(generateTimeSlots().map((slot) => ({ ...slot, isBooked: false })));
    } finally {
      setFetchingSlots(false);
    }
  }, [generateTimeSlots, therapistUserId]);

  // Fetch therapist's available days on modal open
  useEffect(() => {
    const fetchAvailDays = async () => {
      if (!open || !therapistUserId) {
        return;
      }

      try {
        const today = new Date();
        const response = await sessionService.getAvailableSlots(therapistUserId, today);
        const data = response.data || {};
        if (data.availableDays) {
          setTherapistAvailDays(data.availableDays);
        }
      } catch (error) {
        console.error('Failed to fetch therapist availability:', error);
      }
    };

    fetchAvailDays();
  }, [open, therapistUserId, fetchAvailableSlots]);

  // Fetch available slots for selected date
  useEffect(() => {
    if (!open || !selectedDate) {
      return;
    }

    fetchAvailableSlots(selectedDate);
  }, [selectedDate, open, fetchAvailableSlots]);

  useEffect(() => {
    if (!open || !selectedDate) {
      return undefined;
    }

    const timer = setInterval(() => {
      fetchAvailableSlots(selectedDate);
    }, 15000);

    return () => clearInterval(timer);
  }, [open, selectedDate, fetchAvailableSlots]);

  useSessionRealtime({
    onSlotUpdate: (payload) => {
      if (!open || !selectedDate || !therapistUserId) {
        return;
      }

      const isSameTherapist = payload?.therapistId === therapistUserId;
      const payloadDate = payload?.sessionDate
        ? format(new Date(payload.sessionDate), 'yyyy-MM-dd')
        : null;
      const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');

      if (isSameTherapist && payloadDate === selectedDateKey) {
        fetchAvailableSlots(selectedDate);
      }
    },
  });

  const handleDateSelect = (daysOffset) => {
    const date = addDays(new Date(), daysOffset);
    date.setHours(0, 0, 0, 0);
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (slot) => {
    setSelectedTime(slot);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    setAvailableSlots((prev) =>
      prev.map((slot) =>
        slot.hour === selectedTime.hour ? { ...slot, status: 'pending', isBooked: true } : slot
      )
    );

    try {
      const sessionDateTime = setHours(
        setMinutes(selectedDate, 0),
        selectedTime.hour
      );

      await onBook({
        therapistId: therapistUserId,
        sessionDate: sessionDateTime.toISOString(),
        durationMinutes: 60,
      });

      toast.success('Slot reserved');
      setSelectedTime(null);

      onClose?.();
    } catch (error) {
      // Always reconcile with server state on failure so conflicting slots remain disabled.
      if (selectedDate) {
        await fetchAvailableSlots(selectedDate);
      }
      setSelectedTime(null);
      toast.error(String(error || 'Failed to reserve slot'));
    } finally {
      setLoading(false);
    }
  };

  // Generate next 7 days
  const upcomingDays = Array.from({ length: 7 }, (_, i) => ({
    offset: i,
    date: addDays(new Date(), i),
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Book session with ${therapistName}`}
      actions={[
        <Button key="cancel" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="book"
          size="sm"
          onClick={handleSubmit}
          disabled={loading || !selectedDate || !selectedTime}
        >
          {loading ? 'Booking...' : 'Confirm booking'}
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Date
          </label>
          <div className="grid grid-cols-4 gap-2">
            {upcomingDays.map(({ offset, date }) => {
              const dayName = DAY_NAMES[date.getDay()];
              const isDayUnavailable = therapistAvailDays.length > 0 && !therapistAvailDays.includes(dayName);
              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

              return (
                <button
                  key={offset}
                  onClick={() => !isDayUnavailable && handleDateSelect(offset)}
                  disabled={isDayUnavailable}
                  className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                    isDayUnavailable
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div>{format(date, 'EEE')}</div>
                  <div>{format(date, 'MMM d')}</div>
                  {isDayUnavailable && <div className="text-[10px] mt-0.5">Unavailable</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Time (1-hour session)
            </label>
            {fetchingSlots ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">Loading available slots...</p>
              </div>
            ) : unavailableDay ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Therapist is not available on this day.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Available on: {therapistAvailDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                </p>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.hour}
                    onClick={() => !slot.isBooked && handleTimeSelect(slot)}
                    disabled={slot.isBooked}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      slot.isBooked
                        ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed opacity-50'
                        : selectedTime?.hour === slot.hour
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {slot.time}
                    {slot.status === 'pending' && <span className="block text-[10px]">Pending</span>}
                    {slot.status === 'confirmed' && <span className="block text-[10px]">Booked</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center">
                No available slots for this date. Please select another date.
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        {selectedDate && selectedTime && (
          <div className="bg-primary-soft border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-slate-700">
              <strong>Booking Summary:</strong>
              <br />
              {therapistName} on {format(selectedDate, 'EEEE, MMMM d, yyyy')} at{' '}
              {selectedTime.time}
              <br />
              Duration: 1 hour
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
