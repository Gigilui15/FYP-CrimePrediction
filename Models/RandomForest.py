import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error

print("Script started.")

# Load the training dataset
print("Loading training dataset...")
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set.csv')

# Separate features and target variable
X_train = train_data.drop(columns=['total_crimes'])
y_train = train_data['total_crimes']

# Initialize the Random Forest regressor
print("Initializing Random Forest regressor...")
rf_regressor = RandomForestRegressor(n_estimators=100, random_state=42)

# Train the model
print("Training the model...")
rf_regressor.fit(X_train, y_train)

# Load the test dataset
print("Loading test dataset...")
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\test_set.csv')

# Separate features and target variable
X_test = test_data.drop(columns=['total_crimes'])
y_test = test_data['total_crimes']

# Predict on the test data
print("Predicting on the test data...")
y_pred = rf_regressor.predict(X_test)

# Print actual and predicted values
print("Actual \t\t Predicted")
for i in range(len(y_test)):
    print(f"{y_test.iloc[i]}\t\t{y_pred[i]}")

# Calculate Mean Squared Error (MSE) as an evaluation metric
mse = mean_squared_error(y_test, y_pred)
print("Mean Squared Error:", mse)

print("Script finished.")
