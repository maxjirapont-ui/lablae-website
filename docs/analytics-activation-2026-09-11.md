# Analytics activation

User authorized activation. Verified in Google Analytics UI after connecting through mobile hotspot:
- Account 377755979, property 516506963: ลำลำลับแลบ้าน 100 ปี.
- Web stream 13143525094, URL https://www.lablae.net/, measurement ID G-8ZCYCYC7JY.
- Enhanced Measurement disabled and confirmed in UI to prevent automatic history/form/search events overlapping with explicit site events.
- Website analytics now defaults ON for the production domain and public paths. Set WEBSITE_ANALYTICS_ENABLED=0 to disable. This supersedes the disabled status in the earlier growth notes.
- Custom code strips arbitrary queries/referrers and sends no booking form values. Page views and menu/directions/phone/booking clicks are explicit. Booking request submitted is not confirmed booking.
- Realtime verification pending deployment. Test visits are included in initial totals.
