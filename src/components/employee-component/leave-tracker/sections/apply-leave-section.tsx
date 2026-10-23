import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RequiredLabel, SelectField, fieldClass } from '@/components/ui/form-fields';
import { LEAVE_DAY_PARTS, LEAVE_TYPES } from '@/lib/constants';
import { leaveRequestSchema, type LeaveRequestFormValues } from '@/lib/schemas';
import type { Holiday, LeaveRequest } from '@/types';
import { countLeaveDays, getDatesInRange, isActiveLeaveOn, isWeekend } from './leave-utils';
import { DatePicker } from '@/components/ui/date-picker';
import { isLeaveTypeAvailable } from '@/lib/leave-eligibility';
import { useMyProfile } from '@/services/apis/profile/use-profile';

const LEAVE_TYPE_OPTIONS = LEAVE_TYPES.map((type) => ({ value: type.id, label: type.label }));

const emptyLeaveRequest: Partial<LeaveRequestFormValues> = {
  leaveType: undefined,
  startDate: '',
  startDayPart: 'full-day',
  endDate: '',
  endDayPart: 'full-day',
  reason: '',
};

interface ApplyLeaveSectionProps {
  requests: LeaveRequest[];
  holidays: Holiday[];
  onApply: (values: LeaveRequestFormValues, days: number) => void;
}

export function ApplyLeaveSection({ requests, holidays, onApply }: ApplyLeaveSectionProps) {
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: emptyLeaveRequest,
  });
  const { control } = form;
  // Maternity / paternity follow the gender on the person's profile (the server checks the same rule)
  const { data: profile } = useMyProfile();
  const leaveTypeOptions = LEAVE_TYPE_OPTIONS.filter((option) => isLeaveTypeAvailable(option.value, profile?.gender));
  // Until the To date is picked by hand it follows the From date; once picked, From can't go past it
  const [endPicked, setEndPicked] = useState(false);
  const resetForm = () => {
    form.reset(emptyLeaveRequest);
    setEndPicked(false);
  };

  const [startDate, startDayPart, endDate, endDayPart] = useWatch({
    control,
    name: ['startDate', 'startDayPart', 'endDate', 'endDayPart'],
  });
  const totalDays = countLeaveDays(startDate, startDayPart, endDate, endDayPart, holidays);

  const submit = (values: LeaveRequestFormValues) => {
    const days = countLeaveDays(values.startDate, values.startDayPart, values.endDate, values.endDayPart, holidays);
    if (days === 0) {
      form.setError('startDate', { message: 'Selected dates fall on weekends or public holidays' });
      return;
    }
    const leaveDates = getDatesInRange(values.startDate, values.endDate);
    if (values.leaveType === 'restricted-holiday') {
      const restrictedDates = new Set(holidays.filter((holiday) => holiday.type === 'restricted').map((holiday) => holiday.date));
      if (!leaveDates.every((date) => isWeekend(date) || restrictedDates.has(date))) {
        form.setError('startDate', { message: 'Restricted Holiday can be applied only on restricted holiday dates' });
        return;
      }
    }
    if (requests.some((request) => leaveDates.some((date) => isActiveLeaveOn(request, date)))) {
      form.setError('startDate', { message: 'You already have a leave request for these dates' });
      return;
    }
    onApply(values, days);
    resetForm();
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <CalendarPlus className="h-5 w-5 text-indigo-600" />
          </div>
          <span>Apply Leave</span>
        </CardTitle>
        <CardDescription>Submit a new leave request for approval</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <SelectField control={control} name="leaveType" label="Leave Type" placeholder="Select Leave Type" options={leaveTypeOptions} />

            <div className="grid grid-cols-5 gap-3">
              <FormField
                control={control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <RequiredLabel>From Date</RequiredLabel>
                    <FormControl>
                      <DatePicker
                        {...field}
                        max={endPicked && endDate ? endDate : undefined}
                        className={fieldClass}
                        onChange={(value) => {
                          field.onChange(value);
                          // The To date follows until it's picked by hand, so single-day requests are one click
                          const end = form.getValues('endDate');
                          if (value && (!endPicked || !end || end < value)) form.setValue('endDate', value, { shouldValidate: !!end });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SelectField control={control} name="startDayPart" label="Part of day" options={LEAVE_DAY_PARTS} required={false} className="col-span-2" />
            </div>

            <div className="grid grid-cols-5 gap-3">
              <FormField
                control={control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <RequiredLabel>To Date</RequiredLabel>
                    <FormControl>
                      <DatePicker
                        {...field}
                        min={startDate || undefined}
                        className={fieldClass}
                        onChange={(value) => {
                          field.onChange(value);
                          setEndPicked(!!value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SelectField control={control} name="endDayPart" label="Part of day" options={LEAVE_DAY_PARTS} required={false} className="col-span-2" />
            </div>

            <FormField
              control={control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Reason</RequiredLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Enter Reason" className={fieldClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-sm">
              <span className="text-gray-600">Total leave days</span>
              <span className="font-semibold text-[#464EB8]">{totalDays}</span>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">Submit</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
