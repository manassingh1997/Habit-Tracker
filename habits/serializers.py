from rest_framework import serializers
from .models import Habit, HabitProgress


class HabitProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitProgress
        fields = '__all__'


class HabitSerializer(serializers.ModelSerializer):
    progress = HabitProgressSerializer(many=True, read_only=True)
    
    class Meta:
        model = Habit
        exclude = ('user',)