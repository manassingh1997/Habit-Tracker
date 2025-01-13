from django.contrib import admin
from .models import *

# Register your models here.
admin.site.register(HabitUser)
admin.site.register(Habit)
admin.site.register(HabitProgress)