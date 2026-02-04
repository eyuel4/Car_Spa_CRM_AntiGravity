from django.contrib import admin
from operations.models import Job, JobItem, JobTask, Visit, VisitService

# Register your models here.
admin.site.register(Job)
admin.site.register(JobItem)
admin.site.register(JobTask)
admin.site.register(Visit)
admin.site.register(VisitService)
