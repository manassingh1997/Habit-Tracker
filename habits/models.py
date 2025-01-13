from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class HabitUser(User):

    phone_number = models.CharField(max_length=10,null=True,blank=True)

class Habit(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    frequency = models.CharField(choices=[('Daily','Daily'),('Weekly','Weekly')],max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class HabitProgress(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="progress")
    date = models.DateField()
    completed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.habit.name} - {self.date} - {'Completed' if self.completed else 'Not Completed'}"
    