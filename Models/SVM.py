import pandas as pd
from sklearn.svm import SVR
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# Load train and test datasets
train_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\train_set.csv')
test_data = pd.read_csv(r'C:\\Users\\luigi\\Desktop\\Third Year\\Thesis\\Artefact\\TrainTestSplit\\test_set.csv')

# Extract features and target
X_train = train_data[['area', 'year', 'month', 'agg_id']]
y_train = train_data['total_crimes']
X_test = test_data[['area', 'year', 'month', 'agg_id']]
y_test = test_data['total_crimes']

# Initialize SVM regressor
svm_regressor = SVR(kernel='linear')

# Train the model
svm_regressor.fit(X_train, y_train)

# Predict on the test set
predictions = svm_regressor.predict(X_test)

# Evaluate the model
mse = mean_squared_error(y_test, predictions)
print("Mean Squared Error:", mse)
