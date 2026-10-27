# MY NAME IS RITIK KUMAR

#  <=== STUDENT MANAGEMENT SYSTEM ===>

# add student
import numpy as np
import matplotlib.pyplot as plt

def add_student():
    name = input("Enter Student Name: ").upper()
    
    with open("student_details.txt") as f:
        roll_check = f.readlines()
    
    roll_no = 1
    for i,line in enumerate(roll_check):
        if line.strip() == f"Roll No: {roll_no}":
            roll_no += 1
        
    course = input("Enter Student Course: ").upper()
    print(f"Your Roll Number Is: {roll_no}")
    
    
#  <=== WRITE DATA IN ANOTHER FILE ===>

    with open("student_details.txt","a") as f:
        f.write(
            f"Student Name: {name} \n"
            f"Roll No: {roll_no}\n"
            f"Course: {course}\n"
            f"{"_"*30}\n"
        )
    
    puchh = input("Do You Add Someone ? (y / n): ").upper()
    if puchh == 'YES' or puchh == "Y":
        return add_student()
    
    return roll_no, name, course

# add_student()

def add_marks():
    
    roll = input("Enter Student Roll Number: ")
    
    
# <=== ROLL NUMBER SE NAME ACCESS KAR RAHE HAI DUSRE FILE KA YAHA ===>
    with open("student_details.txt", "r") as f:
        lines = f.readlines()

    found = False
    for i, line in enumerate(lines):
        if line.strip() == f"Roll No: {roll}":
            name = lines[i - 1].strip()
            name = name.replace(f"Student Name: ","")
            
            print(f"Student Name: {name}")
            found = True
            break
    if not found:
        print("Roll Number Is Not Found !")
        
        
        
#   <=== DUSRE FILE KA EXISTING ROLL NUMBER CHECK KAR RE ===> 
    
    with open("student_details.txt","r") as f:
        data = f.read()
    marks = {}
    if f"Roll No: {roll}" in data:
        for i in range(5):
            subject = input("Enter Subject: ").upper()
            mark = int(input("Enter Marks: "))
            
            marks[subject] = mark
            total = sum(marks.values())
            percentage = (total / 500)*100
    else:
        print("Please Add Student First!")
        
    
    with open("marks.txt","a") as f:
            f.write(f"Roll No: {roll} \n")
            f.write(f"Name: {name} \n")
            for subject,mark in marks.items():
                f.write(f"{subject} : {mark} \n")
            f.write(f"Total Marks: {total} \n")
            f.write(f"Percentage : {percentage} %\n")
            f.write(f"_" * 30 + " \n ")
                
            

# add_marks()


#  <=== CHECK RESULT ===>


def check_result():
    roll = input("Enter Roll Number: ")
    found = False
    subjects = []
    marks = []

    with open("marks.txt", "r") as f:
        for line in f:
            line = line.strip()

            if line == f"Roll No: {roll}":
                found = True
                print("\nStudent Result:")
                print(line)
                continue

            if found:
                if line.startswith("_"):
                    break

                print(line)

                if ": " in line:
                    subject, value = line.split(": ", 1)

                    if value.isdigit() and subject not in [
                        "Total Marks", "Percentage"
                    ]:
                        subjects.append(subject)
                        marks.append(int(value))

    if not found:
        print("Roll Number Not Found!")
        return

    if subjects:
        plt.figure(figsize=(8, 5))
        bars = plt.bar(subjects, marks)

        plt.xlabel("Subjects")
        plt.ylabel("Marks")
        plt.title(f"Marks Graph - Roll No: {roll}")
        plt.bar_label(bars)
        plt.tight_layout()
        plt.show()
    else:
        print("No subject marks found!")

        
# check_result()



import time
while True:
    start = time.time()
    
    print("1. Add Student!")
    print("2. Add Marks!")
    print("3. Check Result!")
    print("4. Exit!")
    
    try:
        check = int(input("Enter Your Choice: "))
    except ValueError:
        print("Please enter a valid number!")
        continue

    
    match check:
        case 1:
            print("<=== Check Student ===>")
            add_student()
        case 2:
            print("<=== Add Marks ===>")
            add_marks()
        case 3:
            print("<=== Check Result ===>")
            check_result()
        case 4:
            break
        case _:
            print("<=== Invailed Choice ===>")
    # print(start - time.time())
